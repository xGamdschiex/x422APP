<script lang="ts">
  import { userStore } from '$lib/stores/user';
  import { calcStore } from '$lib/stores/calc';
  import { WASSER_PROFILE } from '$lib/calc/schema';
  import { getFeedLine } from '$lib/calc/feedlines/registry';
  import { getWochenForPhase } from '$lib/calc/feedlines/types';
  import type { FaktorModus } from '$lib/calc/factor';

  $: prefs = $userStore;
  $: calc = $calcStore;
  $: feedline = getFeedLine(prefs.feedline);
  $: phasen = feedline ? feedline.phasen.map(p => p.name) : ['Veg'];
  $: wochen = feedline ? getWochenForPhase(feedline, prefs.phase) : [1];

  function setField(field: string, value: any) {
    userStore.update(p => ({ ...p, [field]: value }));
  }

  const CALMAG_LABELS: Record<string, string> = { A: 'Athena', B: 'CANNA', BB: 'BioBizz' };
  $: isOrganisch = feedline?.typ === 'organisch';
</script>

<div class="space-y-4">
  <h2 class="font-pixel text-xs text-grow-primary">CALC</h2>

  <!-- Standort + Strain -->
  <div class="card space-y-3">
    <div>
      <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-standort">Standort</label>
      <select id="c-standort" value={prefs.standort} on:change={e => setField('standort', e.currentTarget.value)}>
        {#each WASSER_PROFILE as p}
          <option value={p.name}>{p.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-strain">Strain</label>
      <input id="c-strain" type="text" value={prefs.strain} placeholder="z.B. White Widow"
             on:input={e => setField('strain', e.currentTarget.value)} />
    </div>
  </div>

  <!-- Phase / Woche / Tag -->
  <div class="card">
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-phase">Phase</label>
        <select id="c-phase" value={prefs.phase} on:change={e => {
          const phase = e.currentTarget.value;
          userStore.update(p => ({ ...p, phase, woche: 1, tag: 1 }));
        }}>
          {#each phasen as ph}
            <option value={ph}>{ph}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-woche">Woche</label>
        <select id="c-woche" value={prefs.woche} on:change={e => setField('woche', +e.currentTarget.value)}>
          {#each wochen as w}
            <option value={w}>{w}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-tag">Tag</label>
        <select id="c-tag" value={prefs.tag} on:change={e => setField('tag', +e.currentTarget.value)}>
          {#each [1,2,3,4,5,6,7] as t}
            <option value={t}>{t}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Reservoir + Faktor -->
  <div class="card">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-reservoir">Reservoir (L)</label>
        <input id="c-reservoir" type="number" value={prefs.reservoir_L} min="1" max="200" step="1"
               on:input={e => setField('reservoir_L', +e.currentTarget.value)} />
      </div>
      <div>
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-faktor">Faktor-Modus</label>
        <select id="c-faktor" value={prefs.faktor_modus} on:change={e => setField('faktor_modus', e.currentTarget.value)}>
          <option value="Auto">Auto</option>
          <option value="Manuell">Manuell</option>
        </select>
      </div>
    </div>
    {#if prefs.faktor_modus === 'Manuell'}
      <div class="mt-3">
        <label class="text-[10px] text-grow-muted uppercase block mb-1" for="c-faktor-man">Faktor (%)</label>
        <input id="c-faktor-man" type="number" value={prefs.faktor_manuell} min="20" max="100"
               on:input={e => setField('faktor_manuell', +e.currentTarget.value)} />
      </div>
    {/if}
  </div>

  <!-- Ergebnis -->
  {#if calc.result}
    {@const r = calc.result}
    <div class="card border-grow-primary/40">
      <h3 class="font-pixel text-[10px] text-grow-primary mb-3">ERGEBNIS</h3>

      {#if isOrganisch}
        <p class="text-[10px] text-grow-warn p-2 rounded bg-grow-warn/10 mb-2">Organisch — EC nur Richtwert, nicht exakt messbar</p>
      {/if}

      <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <span class="text-grow-muted">EC-Soll</span>
        <span class="font-bold text-grow-accent text-right">{r.ec_soll} {prefs.ec_einheit}</span>

        <span class="text-grow-muted">pH-Ziel</span>
        <span class="font-bold text-grow-water text-right">{r.ph_ziel}</span>

        <span class="text-grow-muted">Faktor</span>
        <span class="text-right">{r.faktor_aktiv}%</span>

        {#if prefs.hat_ro}
          <span class="text-grow-muted">Hahn-Anteil</span>
          <span class="text-right">{r.hahn_pct}%</span>
        {:else}
          <span class="text-grow-muted">LW-EC</span>
          <span class="text-right">{r.lw_ec} {prefs.ec_einheit}</span>
        {/if}
      </div>

      {#if r.ec_budget_warnung}
        <p class="text-[10px] text-grow-danger mt-2 p-2 rounded bg-grow-danger/10">{r.ec_budget_warnung}</p>
      {/if}

      <hr class="border-grow-primary/10 my-3" />

      <h4 class="text-[10px] text-grow-muted uppercase mb-2">Wasser (Tank: {prefs.reservoir_L}L)</h4>
      <div class="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
        {#if prefs.hat_ro}
          <span class="text-grow-muted">RO-Wasser</span>
          <span class="text-right">{r.ro_L} L</span>
          <span class="text-grow-muted">Leitungswasser</span>
          <span class="text-right">{r.lw_L} L</span>
        {:else}
          <span class="text-grow-muted">Leitungswasser</span>
          <span class="text-right">{prefs.reservoir_L} L</span>
          <span class="text-[10px] text-grow-warn col-span-2">Kein RO — nur Leitungswasser</span>
        {/if}
      </div>

      <hr class="border-grow-primary/10 my-3" />

      <h4 class="text-[10px] text-grow-muted uppercase mb-2">Dosierung</h4>
      <div class="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
        {#each r.dosierungen as d}
          <span class="text-grow-muted">{d.product.name}</span>
          <span class="text-right font-bold">{d.display}</span>
        {/each}

        {#if r.cleanse_mL_tank > 0}
          <span class="text-grow-muted">Cleanse</span>
          <span class="text-right">{r.cleanse_mL_tank} mL</span>
        {/if}
      </div>

      {#if r.calmag.calmag_mL_total > 0 || r.calmag.mono_mg_mL_total > 0}
        <hr class="border-grow-primary/10 my-3" />

        <h4 class="text-[10px] text-grow-muted uppercase mb-2">CalMag</h4>
        <div class="grid grid-cols-2 gap-y-1 gap-x-4 text-sm">
          {#if r.calmag.calmag_mL_total > 0}
            <span class="text-grow-muted">{CALMAG_LABELS[prefs.calmag_typ] ?? ''} CalMag</span>
            <span class="text-right font-bold">{r.calmag.calmag_mL_total} mL</span>
          {/if}

          {#if r.calmag.mono_mg_mL_total > 0}
            <span class="text-grow-muted">Mono Mg</span>
            <span class="text-right">{r.calmag.mono_mg_mL_total} mL</span>
          {/if}

          <span class="text-grow-muted">Ca:Mg</span>
          <span class="text-right {r.calmag.ratio_ok ? 'text-grow-primary' : 'text-grow-danger'}">
            {r.calmag.camg_ratio}
          </span>
        </div>
      {/if}

      {#if r.schema.hinweis}
        <p class="text-[10px] text-grow-warn mt-3">{r.schema.hinweis}</p>
      {/if}

      {#if feedline?.hinweise && feedline.hinweise.length > 0}
        <details class="mt-3">
          <summary class="text-[10px] text-grow-accent cursor-pointer select-none">
            Tipps fuer {feedline.name}
          </summary>
          <ul class="mt-1 space-y-1">
            {#each feedline.hinweise as h}
              <li class="text-[10px] text-grow-muted pl-2 border-l-2 border-grow-accent/30">{h}</li>
            {/each}
          </ul>
        </details>
      {/if}
    </div>

    <!-- Link to Mix -->
    <a href="/mix" class="block w-full text-center bg-grow-primary text-grow-dark font-bold py-3 rounded-xl hover:bg-grow-accent transition-colors">
      Mischvorgang starten
    </a>
  {/if}

  {#if calc.error}
    <div class="card border-grow-danger/40">
      <p class="text-grow-danger text-sm">{calc.error}</p>
    </div>
  {/if}
</div>
