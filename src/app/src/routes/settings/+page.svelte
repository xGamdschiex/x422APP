<script lang="ts">
  import { userStore } from '$lib/stores/user';
  import { queueCountStore, clearQueue } from '$lib/stores/sync';
  import { getApiUrl, setApiUrl, isApiConfigured, saveGamification, fetchGamification } from '$lib/api/sheets';
  import { getAllFeedLines, getFeedLine } from '$lib/calc/feedlines/registry';
  import { authStore, isLoggedIn } from '$lib/stores/auth';
  import { zwergeStore } from '$lib/stores/zwerge';
  import { gameStore } from '$lib/stores/growgame';
  import { get } from 'svelte/store';
  import type { CalMagTyp } from '$lib/calc/schema';
  import type { ECEinheit } from '$lib/calc/units';
  import type { Medium } from '$lib/calc/feedlines/types';

  let apiUrl = getApiUrl() ?? '';
  let apiSaved = false;
  let syncStatus = '';
  let syncing = false;

  async function syncToSheet() {
    const auth = get(authStore);
    if (!auth?.email || !isApiConfigured()) return;
    syncing = true;
    syncStatus = '';
    try {
      const state = get(zwergeStore);
      const result = await saveGamification({ ...state, user_email: auth.email });
      syncStatus = result.ok ? 'Gespeichert ✓' : 'Fehler: ' + result.error;
    } catch { syncStatus = 'Offline'; }
    syncing = false;
    setTimeout(() => { syncStatus = ''; }, 3000);
  }

  async function syncFromSheet() {
    const auth = get(authStore);
    if (!auth?.email || !isApiConfigured()) return;
    syncing = true;
    syncStatus = '';
    try {
      const result = await fetchGamification(auth.email);
      if (result.ok && result.data) {
        zwergeStore.loadFromSheet(result.data);
        syncStatus = 'Geladen ✓';
      } else {
        syncStatus = result.error === 'not_found' ? 'Noch keine Daten im Sheet' : ('Fehler: ' + result.error);
      }
    } catch { syncStatus = 'Offline'; }
    syncing = false;
    setTimeout(() => { syncStatus = ''; }, 3000);
  }

  $: auth = $authStore;
  $: loggedIn = $isLoggedIn;

  $: prefs = $userStore;
  $: feedlines = getAllFeedLines();
  $: activeLine = getFeedLine(prefs.feedline);

  function saveApi() {
    setApiUrl(apiUrl);
    apiSaved = true;
    setTimeout(() => { apiSaved = false; }, 2000);
  }

  function setField(field: string, value: any) {
    userStore.update(p => ({ ...p, [field]: value }));
  }

  function onFeedlineChange(e: Event) {
    const id = (e.currentTarget as HTMLSelectElement).value;
    const line = getFeedLine(id);
    if (!line) return;
    const firstPhase = line.phasen[0]?.name ?? 'Veg';
    userStore.update(p => ({ ...p, feedline: id, phase: firstPhase, woche: 1, tag: 1 }));
  }

  function resetPrefs() {
    userStore.reset();
  }
</script>

<div class="space-y-4">
  <h2 class="font-pixel text-xs text-grow-primary">SETUP</h2>

  <!-- User Account -->
  {#if loggedIn && auth}
    <div class="card space-y-3">
      <h3 class="text-xs text-grow-muted uppercase">Account</h3>
      <div class="flex items-center gap-3">
        {#if auth.picture}
          <img src={auth.picture} alt="" class="w-10 h-10 rounded-full border border-grow-primary/40" referrerpolicy="no-referrer" />
        {/if}
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold truncate">{auth.name}</p>
          <p class="text-[10px] text-grow-muted truncate">{auth.email}</p>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-grow-primary/20 text-grow-primary font-bold uppercase">
          {auth.role}
        </span>
      </div>
      <button on:click={() => authStore.logout()}
              class="w-full py-2 rounded-lg border border-grow-danger/30 text-grow-danger text-sm">
        Abmelden
      </button>
    </div>
  {:else}
    <div class="card space-y-3">
      <h3 class="text-xs text-grow-muted uppercase">Account</h3>
      <p class="text-[11px] text-grow-muted">Nicht angemeldet — Daten nur lokal gespeichert.</p>
      <a href="/login"
         class="block w-full py-2 rounded-lg bg-grow-primary text-grow-dark font-bold text-sm text-center">
        Mit Google anmelden
      </a>
    </div>
  {/if}

  <!-- Duengerlinie -->
  <div class="card space-y-3">
    <h3 class="text-xs text-grow-muted uppercase">Duengerlinie</h3>
    <div>
      <label class="text-[10px] text-grow-muted uppercase block mb-1" for="s-feedline">Linie</label>
      <select id="s-feedline" value={prefs.feedline} on:change={onFeedlineChange}>
        {#each feedlines as fl}
          <option value={fl.id}>{fl.name}</option>
        {/each}
      </select>
    </div>
    {#if activeLine}
      <div class="flex items-center gap-2 text-xs">
        <span class="px-2 py-0.5 rounded bg-grow-primary/20 text-grow-primary">
          {activeLine.typ}
        </span>
        <span class="text-grow-muted">{activeLine.hersteller}</span>
      </div>
      <div class="flex flex-wrap gap-1">
        {#each activeLine.medien as m}
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-grow-surface text-grow-muted border border-grow-border/20">{m}</span>
        {/each}
      </div>
      {#if activeLine.hinweise && activeLine.hinweise.length > 0}
        <details class="mt-2">
          <summary class="text-[10px] text-grow-accent cursor-pointer select-none">
            Hinweise ({activeLine.hinweise.length})
          </summary>
          <ul class="mt-1 space-y-1">
            {#each activeLine.hinweise as h}
              <li class="text-[10px] text-grow-muted pl-2 border-l-2 border-grow-accent/30">{h}</li>
            {/each}
          </ul>
        </details>
      {/if}
    {/if}
  </div>

  <!-- Medium + CalMag + EC -->
  <div class="card space-y-3">
    <h3 class="text-xs text-grow-muted uppercase">Anbau</h3>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="s-medium">Medium</label>
        <select id="s-medium" value={prefs.medium} on:change={e => setField('medium', e.currentTarget.value)}>
          <option value="hydro">Hydro</option>
          <option value="coco">Coco</option>
          <option value="erde">Erde</option>
        </select>
      </div>
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="s-calmag">CalMag</label>
        <select id="s-calmag" value={prefs.calmag_typ} on:change={e => setField('calmag_typ', e.currentTarget.value)}>
          <option value="A">Athena</option>
          <option value="B">CANNA</option>
          <option value="BB">BioBizz</option>
        </select>
      </div>
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="s-ec">EC-Einheit</label>
        <select id="s-ec" value={prefs.ec_einheit} on:change={e => setField('ec_einheit', e.currentTarget.value)}>
          <option value="mS/cm">mS/cm</option>
          <option value="ppm500">ppm 500</option>
          <option value="ppm700">ppm 700</option>
        </select>
      </div>
    </div>
    <!-- RO-Wasser Toggle -->
    <label class="flex items-center gap-3 cursor-pointer" for="s-ro">
      <input id="s-ro" type="checkbox" checked={prefs.hat_ro}
             on:change={e => setField('hat_ro', e.currentTarget.checked)}
             class="w-5 h-5 rounded border-grow-border accent-grow-primary" />
      <div>
        <span class="text-sm text-grow-text">RO-Wasser vorhanden</span>
        <p class="text-[10px] text-grow-muted">
          {prefs.hat_ro ? 'RO + Leitungswasser werden gemischt' : 'Nur Leitungswasser — kein RO/LW-Split'}
        </p>
      </div>
    </label>
  </div>

  <!-- Google API — nur für owner sichtbar -->
  {#if auth?.role === 'owner'}
  <div class="card space-y-3">
    <h3 class="text-xs text-grow-muted uppercase">Google Apps Script API</h3>
    <p class="text-[10px] text-grow-muted">
      Web App URL — nur für Admins sichtbar.
    </p>
    <label class="sr-only" for="s-api">API URL</label>
    <input id="s-api" type="text" bind:value={apiUrl}
           placeholder="https://script.google.com/macros/s/.../exec" />
    <button on:click={saveApi}
            class="w-full py-2 rounded-lg bg-grow-primary text-grow-dark font-bold text-sm">
      Speichern
    </button>
    {#if apiSaved}
      <p class="text-grow-primary text-xs text-center">Gespeichert!</p>
    {/if}
    {#if isApiConfigured()}
      <p class="text-grow-primary text-xs">API konfiguriert ✓</p>
    {:else}
      <p class="text-grow-warn text-xs">Noch keine API-URL gesetzt</p>
    {/if}
  </div>
  {/if}

  <!-- Grow-Run -->
  <div class="card space-y-3">
    <h3 class="text-xs text-grow-muted uppercase">Grow-Run</h3>
    <div>
      <label class="text-[10px] text-grow-muted uppercase block mb-1" for="run-id">Run-ID</label>
      <input id="run-id" type="text" value={$userStore.run_id}
             placeholder="z.B. run-2026-spring"
             on:input={e => userStore.update(p => ({ ...p, run_id: e.currentTarget.value }))} />
    </div>
    <p class="text-[10px] text-grow-muted">
      Vergib eine ID pro Grow-Durchgang zur Unterscheidung im Archiv.
    </p>
  </div>

  <!-- Gamification Sync -->
  {#if $isLoggedIn && isApiConfigured()}
    <div class="card space-y-3">
      <h3 class="text-xs text-grow-muted uppercase">Zwerge & Seeds — Cloud Sync</h3>
      <p class="text-[10px] text-grow-muted">Daten zwischen Gerät und Sheet abgleichen.</p>
      <div class="grid grid-cols-2 gap-2">
        <button on:click={syncFromSheet} disabled={syncing}
                class="py-2 rounded-lg border border-grow-primary/30 text-grow-primary text-xs disabled:opacity-50">
          ↓ Laden
        </button>
        <button on:click={syncToSheet} disabled={syncing}
                class="py-2 rounded-lg border border-grow-primary/30 text-grow-primary text-xs disabled:opacity-50">
          ↑ Speichern
        </button>
      </div>
      {#if syncStatus}
        <p class="text-[10px] text-center text-grow-accent">{syncStatus}</p>
      {/if}
    </div>
  {/if}

  <!-- Optionen -->
  <div class="card space-y-3 border-grow-danger/30">
    <h3 class="text-xs text-grow-danger uppercase">Optionen</h3>
    <button on:click={clearQueue}
            class="w-full py-2 rounded-lg border border-grow-danger/30 text-grow-danger text-sm">
      Offline-Queue leeren ({$queueCountStore} Eintraege)
    </button>
    <button on:click={resetPrefs}
            class="w-full py-2 rounded-lg border border-grow-danger/30 text-grow-danger text-sm">
      Einstellungen zuruecksetzen
    </button>
    <button on:click={() => { if (confirm('Spielstand wirklich löschen?')) gameStore.reset(); }}
            class="w-full py-2 rounded-lg border border-grow-danger/30 text-grow-danger text-sm">
      Spielstand zurücksetzen
    </button>
  </div>

  <div class="card">
    <h3 class="text-xs text-grow-muted uppercase mb-2">Info</h3>
    <div class="text-xs text-grow-muted space-y-1">
      <p>x422 feeding v0.2.0</p>
      <p>SvelteKit + Tailwind + Google Sheets</p>
      <p>PWA — installierbar auf dem Handy</p>
    </div>
  </div>
</div>
