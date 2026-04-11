<script lang="ts">
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';
  import { calcStore } from '$lib/stores/calc';
  import { onlineStore, queueStore, queueCountStore, syncingStore, enqueueLog, flushQueue } from '$lib/stores/sync';
  import { isApiConfigured, fetchLog } from '$lib/api/sheets';
  import type { LogEntry } from '$lib/api/sheets';
  import { authStore } from '$lib/stores/auth';
  import { zwergeStore } from '$lib/stores/zwerge';
  import type { BuffTrigger } from '$lib/stores/zwerge';
  import { gameStore } from '$lib/stores/growgame';

  $: prefs = $userStore;
  $: calc = $calcStore;
  $: online = $onlineStore;
  $: queue = $queueStore;
  $: queueCount = $queueCountStore;
  $: syncing = $syncingStore;

  function parseDosis(json: string | undefined): { name: string; menge: string }[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  let istEc = '';
  let istPh = '';
  let notiz = '';
  let saved = false;

  // Historie
  let sheetEntries: LogEntry[] = [];
  let loadingHistory = false;
  let historyError = '';

  /** Alle Einträge: Queue (pending) + Sheet (synced), nach Datum sortiert */
  $: allEntries = [
    ...queue.map(e => ({ ...e, _pending: true as const })),
    ...sheetEntries.map(e => ({ ...e, _pending: false as const }))
  ].sort((a, b) => b.datum.localeCompare(a.datum));

  async function loadHistory() {
    if (!isApiConfigured() || !online) return;
    loadingHistory = true;
    historyError = '';
    const res = await fetchLog(undefined, 20);
    if (res.ok && res.data) {
      sheetEntries = res.data;
    } else {
      historyError = res.error || 'Fehler beim Laden';
    }
    loadingHistory = false;
  }

  onMount(() => {
    loadHistory();
  });

  function logEntry() {
    if (!calc.result) return;
    const r = calc.result;

    const entry: LogEntry = {
      datum: new Date().toISOString().slice(0, 10),
      wasserprofil: prefs.standort,
      phase: prefs.phase,
      woche: prefs.woche,
      tag: prefs.tag,
      strain: prefs.strain,
      reservoir_L: prefs.reservoir_L,
      faktor_pct: r.faktor_aktiv,
      hahn_pct: r.hahn_pct,
      ec_soll: r.ec_soll,
      ec_ist_roh: istEc ? +istEc : 0,
      ec_ist_korr: istEc ? +istEc : 0,
      ph_ist_roh: istPh ? +istPh : 0,
      ph_ist_korr: istPh ? +istPh : 0,
      ca_ziel: r.schema.ca_ziel ?? 0,
      mg_ziel: r.schema.mg_ziel ?? 0,
      ca_ist_a: r.calmag.ca_ist,
      mg_ist_a: r.calmag.mg_ist,
      ca_ist_b: prefs.calmag_typ !== 'A' ? r.calmag.ca_ist : 0,
      mg_ist_b: prefs.calmag_typ !== 'A' ? r.calmag.mg_ist : 0,
      camg_ratio: r.calmag.camg_ratio,
      grow_g: r.grow_g,
      bloom_g: r.bloom_g,
      core_g: r.core_g,
      fade_mL: r.fade_mL,
      cleanse_mL: r.cleanse_mL_tank,
      calmag_mLpL: r.calmag.calmag_mLpL,
      calmag_mL_total: r.calmag.calmag_mL_total,
      mono_mL: r.calmag.mono_mg_mL_total,
      calmag_typ: prefs.calmag_typ,
      ec_einheit: prefs.ec_einheit,
      run_id: prefs.run_id || `run-${Date.now()}`,
      notiz: notiz,
      user_id: $authStore?.email ?? undefined,
      feedline: prefs.feedline,
      dosierungen_json: JSON.stringify(
        r.dosierungen.map(d => ({ name: d.product.name, menge: d.display }))
      ),
    };

    enqueueLog(entry);

    // Seeds verdienen
    const triggers: BuffTrigger[] = ['log_save'];
    if (istPh) triggers.push('has_ph');
    if (istEc) triggers.push('has_ec');
    if (notiz) triggers.push('has_notiz');
    const phase = prefs.phase.toLowerCase();
    if (phase.includes('bloom')) triggers.push('bloom_phase');
    if (phase.includes('veg')) triggers.push('veg_phase');
    if (phase.includes('flush')) triggers.push('flush_phase');
    if (phase.includes('bloom') && prefs.woche >= 5) triggers.push('bloom_w5plus');
    if (prefs.medium === 'coco') triggers.push('medium_coco');
    if (prefs.medium === 'hydro') triggers.push('medium_hydro');
    if (prefs.medium === 'erde') triggers.push('medium_erde');
    if (prefs.hat_ro) triggers.push('has_ro');
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) triggers.push('night_login');
    // Alte Seed-Buffs fuer Zwerge beibehalten (fuer Pack-Discount etc.)
    zwergeStore.earnSeeds(1, triggers);
    zwergeStore.trackLog(prefs.strain);
    // Log-Tokens verdienen (fuer spezielle Calc-Packs)
    gameStore.addLogTokens(1);
    // Buds-Bonus fuer Calc-Nutzung
    gameStore.addBuds(3);

    if (online && isApiConfigured()) {
      flushQueue().then(() => loadHistory());
    }

    saved = true;
    setTimeout(() => { saved = false; }, 3000);
    istEc = '';
    istPh = '';
    notiz = '';
  }
</script>

<div class="space-y-4">
  <h2 class="font-pixel text-xs text-grow-primary">LOG</h2>

  <div class="card space-y-3">
    <h3 class="text-xs text-grow-muted uppercase">Messwerte eingeben</h3>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="ist-ec">Ist-EC ({prefs.ec_einheit})</label>
        <input id="ist-ec" type="number" bind:value={istEc} placeholder="z.B. 2.8" step="0.01" />
      </div>
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="ist-ph">Ist-pH</label>
        <input id="ist-ph" type="number" bind:value={istPh} placeholder="z.B. 5.9" step="0.1" min="1" max="14" />
      </div>
    </div>
    <div>
      <label class="text-[10px] text-grow-muted uppercase block mb-1" for="notiz">Notiz</label>
      <input id="notiz" type="text" bind:value={notiz} placeholder="Optional..." />
    </div>
    <button on:click={logEntry} disabled={!calc.result}
            class="w-full py-3 rounded-xl bg-grow-primary text-grow-dark font-bold
                   hover:bg-grow-accent transition-colors disabled:opacity-30">
      Eintrag speichern
    </button>
    {#if saved}
      <p class="text-center text-grow-primary text-sm animate-pulse">Gespeichert!</p>
    {/if}
  </div>

  <div class="card">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full {online ? 'bg-grow-primary' : 'bg-grow-danger'}"></span>
        <span class="text-xs">{online ? 'Online' : 'Offline'}</span>
      </div>
      <span class="text-xs text-grow-muted">{queueCount} in Queue</span>
    </div>
    {#if queueCount > 0 && online}
      <button on:click={flushQueue} disabled={syncing}
              class="w-full mt-3 py-2 rounded-lg border border-grow-primary/30 text-grow-primary text-sm disabled:opacity-50">
        {syncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
      </button>
    {/if}
    {#if !isApiConfigured()}
      <p class="text-grow-warn text-xs mt-2">
        API-URL nicht konfiguriert. <a href="/settings" class="underline">Setup</a>
      </p>
    {/if}
  </div>

  {#if calc.result}
    {@const r = calc.result}
    <div class="card">
      <h3 class="text-xs text-grow-muted uppercase mb-2">Aktuelle Berechnung</h3>
      <div class="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p class="text-grow-accent font-bold">{r.ec_soll}</p>
          <p class="text-[10px] text-grow-muted">EC-Soll</p>
        </div>
        <div>
          <p class="text-grow-water font-bold">{r.ph_ziel}</p>
          <p class="text-[10px] text-grow-muted">pH</p>
        </div>
        <div>
          <p class="font-bold">{r.faktor_aktiv}%</p>
          <p class="text-[10px] text-grow-muted">Faktor</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Log-Historie -->
  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs text-grow-muted uppercase">Historie</h3>
      <button on:click={loadHistory} disabled={loadingHistory || !online}
              class="text-[10px] text-grow-primary disabled:opacity-30">
        {loadingHistory ? 'Lade...' : 'Aktualisieren'}
      </button>
    </div>

    {#if historyError}
      <p class="text-grow-danger text-xs mb-2">{historyError}</p>
    {/if}

    {#if allEntries.length === 0}
      <p class="text-grow-muted text-xs text-center py-4">Noch keine Einträge</p>
    {:else}
      <div class="space-y-2 max-h-[50vh] overflow-y-auto">
        {#each allEntries as entry}
          <div class="rounded-lg bg-grow-dark/50 border border-grow-border/20 p-2.5">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono">{entry.datum}</span>
              <div class="flex items-center gap-2">
                {#if entry._pending}
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-grow-warn/20 text-grow-warn">Pending</span>
                {/if}
                {#if entry.feedline}
                  <span class="text-[9px] px-1 py-0.5 rounded bg-grow-primary/10 text-grow-muted">{entry.feedline}</span>
                {/if}
                <span class="text-[10px] text-grow-muted">{entry.phase} W{entry.woche}</span>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-1 text-center text-[10px]">
              <div>
                <p class="text-grow-accent font-bold">{entry.ec_soll}</p>
                <p class="text-grow-muted">Soll</p>
              </div>
              <div>
                <p class="font-bold {entry.ec_ist_roh ? 'text-grow-primary' : 'text-grow-muted'}">{entry.ec_ist_roh || '—'}</p>
                <p class="text-grow-muted">Ist-EC</p>
              </div>
              <div>
                <p class="font-bold {entry.ph_ist_roh ? 'text-grow-water' : 'text-grow-muted'}">{entry.ph_ist_roh || '—'}</p>
                <p class="text-grow-muted">pH</p>
              </div>
              <div>
                <p class="font-bold">{entry.faktor_pct}%</p>
                <p class="text-grow-muted">Faktor</p>
              </div>
            </div>
            {#if entry.dosierungen_json}
              {@const dosis = parseDosis(entry.dosierungen_json)}
              <div class="flex flex-wrap gap-1 mt-1">
                {#each dosis as d}
                  <span class="text-[9px] px-1 py-0.5 rounded bg-grow-primary/10 text-grow-muted">{d.name}: {d.menge}</span>
                {/each}
              </div>
            {/if}
            {#if entry.notiz}
              <p class="text-[10px] text-grow-muted mt-1 truncate">{entry.notiz}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
