<script lang="ts">
  import { gameStore } from '$lib/stores/growgame';
  import { zwergeStore, PACK_DEFS, CALC_PACK_DEFS, RARITY_LABELS, RARITY_COLORS, getZwerg } from '$lib/stores/zwerge';
  import type { PackTier } from '$lib/stores/zwerge';
  import { SEED_PACK_DEFS, getStrain, STRAIN_DEFS } from '$lib/data/strains';
  import { EQUIP_DEFS, getEquip, getEquipForSpace, EXTRACTION_DEFS, getExtraction, SPACE_DEFS, getSpaceDef, ROLE_LABELS } from '$lib/data/equipment';
  import type { SpaceType } from '$lib/data/equipment';
  import PixelZwerg from '$lib/components/PixelZwerg.svelte';

  $: game = $gameStore;
  $: zwerg = $zwergeStore;

  // Tabs
  let tab: 'seeds' | 'equip' | 'spaces' | 'extract' | 'zwerge' = 'seeds';

  // ─── SEED PACKS ──
  function buySeedPack(packId: string) {
    const result = gameStore.buySeedPack(packId);
    if (result.length > 0) {
      seedPackResult = result;
      showSeedResult = true;
    }
  }
  let seedPackResult: string[] = [];
  let showSeedResult = false;

  // ─── EQUIPMENT ──
  function buyEquip(id: string) {
    gameStore.buyEquip(id);
  }

  function repairEquip(id: string) {
    gameStore.repairEquip(id);
  }

  // ─── SPACES ──
  function buySpace(type: SpaceType) {
    gameStore.buySpace(type);
  }

  // ─── EXTRACTION ──
  function buyExtraction(id: string) {
    gameStore.buyExtraction(id);
  }

  // ─── ZWERG PACKS (kosten Buds) ──
  function openZwergPack(tier: PackTier) {
    zwergeStore.openPack(tier);
  }

  function canAffordZwergPack(tier: PackTier): boolean {
    if (tier === 'daily') return zwerg.last_daily_claim !== new Date().toISOString().slice(0, 10);
    const pack = PACK_DEFS.find(p => p.tier === tier);
    if (!pack) return false;
    return game.buds >= pack.cost;
  }

  // Zwerg-Packs kosten Buds — openPack mit paidExternally=true
  function openZwergPackWithBuds(tier: PackTier) {
    if (tier === 'daily') {
      zwergeStore.openPack(tier);
      return;
    }
    const effectiveCost = zwergeStore.getEffectiveCost(zwerg, tier);
    if (game.buds < effectiveCost) return;
    gameStore.addBuds(-effectiveCost);
    zwergeStore.openPack(tier, true);
  }

  // Calc-Packs kosten Log-Tokens
  function openCalcPack(tier: import('$lib/stores/zwerge').CalcPackTier) {
    const pack = CALC_PACK_DEFS.find(p => p.tier === tier);
    if (!pack || game.log_tokens < pack.cost_tokens) return;
    gameStore.addLogTokens(-pack.cost_tokens);
    zwergeStore.openPack('naehrstoff', true); // nutzt naehrstoff-Pack Logik
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="font-pixel text-xs text-grow-primary">SHOP</h2>
    <div class="flex items-center gap-3 text-xs">
      <span class="text-green-400 font-bold">{game.buds} Buds</span>
      <span class="text-yellow-400 font-bold">{game.wax}g Wax</span>
      <span class="text-purple-400 font-bold">{game.log_tokens} Tokens</span>
    </div>
  </div>

  <!-- Tab-Nav -->
  <div class="flex gap-1 overflow-x-auto pb-1">
    {#each [
      { id: 'seeds', label: 'Samen' },
      { id: 'equip', label: 'Equipment' },
      { id: 'spaces', label: 'Raeume' },
      { id: 'extract', label: 'Extraktion' },
      { id: 'zwerge', label: 'Zwerg-Packs' },
    ] as t}
      <button on:click={() => tab = t.id}
              class="px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-colors
                     {tab === t.id ? 'bg-grow-primary text-grow-dark font-bold' : 'bg-grow-surface text-grow-muted'}">
        {t.label}
      </button>
    {/each}
  </div>

  <!-- ═══ SAMEN-TAB ═══ -->
  {#if tab === 'seeds'}
    <div class="space-y-2">
      {#each SEED_PACK_DEFS as pack}
        {@const affordable = game.buds >= pack.cost_buds}
        <div class="card flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold truncate">{pack.label}</p>
            <p class="text-[10px] text-grow-muted">{pack.breeder} — {pack.seed_count} Seeds</p>
            {#if pack.guaranteed_rarity}
              <p class="text-[9px] {RARITY_COLORS[pack.guaranteed_rarity]}">1x {RARITY_LABELS[pack.guaranteed_rarity]} garantiert</p>
            {/if}
          </div>
          <button on:click={() => buySeedPack(pack.id)}
                  disabled={!affordable}
                  class="px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95
                         {affordable ? 'bg-green-600 text-white' : 'bg-grow-dark text-grow-muted opacity-40'}">
            {pack.cost_buds} Buds
          </button>
        </div>
      {/each}
    </div>

    <!-- Inventar -->
    {#if game.seed_inventory.length > 0}
      <div class="card">
        <h3 class="text-xs text-grow-muted uppercase mb-2">Samen-Inventar</h3>
        <div class="space-y-1">
          {#each game.seed_inventory as si}
            {@const strain = getStrain(si.strain_id)}
            {#if strain}
              <div class="flex items-center justify-between text-xs">
                <span class="{RARITY_COLORS[strain.rarity]}">{strain.name}</span>
                <span class="text-grow-muted">x{si.count}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

  <!-- ═══ EQUIPMENT-TAB ═══ -->
  {:else if tab === 'equip'}
    <div class="space-y-2">
      {#each EQUIP_DEFS as eq}
        {@const owned = game.equipment.find(e => e.equip_id === eq.id)}
        {@const affordable = game.buds >= eq.cost_buds}
        <div class="card flex items-center justify-between
                    {owned ? 'border-grow-primary/30' : ''}">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold truncate">{eq.name}</p>
            <p class="text-[10px] text-grow-muted">
              {eq.category === 'light' ? 'Licht' : eq.category === 'venti' ? 'Venti' : eq.category === 'abluft' ? 'Abluft' : 'Entfeuchter'}
              — Ertrag x{eq.yield_mult} {eq.speed_mult > 1 ? `Speed x${eq.speed_mult}` : ''}
            </p>
            {#if eq.break_chance > 0.01}
              <p class="text-[9px] text-grow-warn">Bruchrisiko: {Math.round(eq.break_chance * 100)}%</p>
            {/if}
          </div>
          {#if owned?.broken}
            <button on:click={() => repairEquip(eq.id)}
                    disabled={game.buds < eq.repair_cost}
                    class="px-3 py-2 rounded-lg text-xs font-bold bg-grow-warn text-grow-dark active:scale-95">
              Reparieren ({eq.repair_cost})
            </button>
          {:else if owned}
            <span class="text-[10px] text-grow-primary font-bold">Besitzt</span>
          {:else}
            <button on:click={() => buyEquip(eq.id)}
                    disabled={!affordable}
                    class="px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95
                           {affordable ? 'bg-green-600 text-white' : 'bg-grow-dark text-grow-muted opacity-40'}">
              {eq.cost_buds} Buds
            </button>
          {/if}
        </div>
      {/each}
    </div>

  <!-- ═══ RAEUME-TAB ═══ -->
  {:else if tab === 'spaces'}
    <div class="space-y-3">
      {#each SPACE_DEFS as spaceDef}
        {@const owned = game.spaces.some(sp => sp.type === spaceDef.type)}
        {@const affordable = game.buds >= spaceDef.cost_buds}
        {@const hasPrereq = !spaceDef.requires || game.spaces.some(sp => sp.type === spaceDef.requires)}
        <div class="card {owned ? 'border-grow-primary/40' : ''}">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-xs font-bold">{spaceDef.label}</p>
              <p class="text-[10px] text-grow-muted">Max {spaceDef.max_plants} Pflanzen</p>
            </div>
            {#if owned}
              <span class="text-[10px] text-grow-primary font-bold px-2 py-1 rounded bg-grow-primary/10">Aktiv</span>
            {:else if spaceDef.cost_buds === 0}
              <span class="text-[10px] text-grow-primary font-bold">Start</span>
            {:else}
              <button on:click={() => buySpace(spaceDef.type)}
                      disabled={!affordable || !hasPrereq}
                      class="px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95
                             {affordable && hasPrereq ? 'bg-green-600 text-white' : 'bg-grow-dark text-grow-muted opacity-40'}">
                {spaceDef.cost_buds} Buds
              </button>
            {/if}
          </div>
          <div class="flex flex-wrap gap-1">
            {#each spaceDef.required_roles as role}
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-grow-surface text-grow-muted">{ROLE_LABELS[role]}</span>
            {/each}
          </div>
          {#if !hasPrereq && !owned}
            <p class="text-[9px] text-grow-warn mt-1">Benoetigt: {getSpaceDef(spaceDef.requires || 'fensterbank').label}</p>
          {/if}
        </div>
      {/each}
    </div>

  <!-- ═══ EXTRAKTION-TAB ═══ -->
  {:else if tab === 'extract'}
    <div class="space-y-2">
      {#each EXTRACTION_DEFS as ext}
        {@const owned = game.owned_extractions.includes(ext.id)}
        {@const affordable = game.buds >= ext.cost_buds}
        {@const hasPrereq = !ext.requires || game.owned_extractions.includes(ext.requires)}
        {@const canRun = owned && game.buds >= ext.input_buds}
        <div class="card {owned ? 'border-grow-primary/30' : ''}">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold truncate">{ext.name}</p>
              <p class="text-[10px] text-grow-muted">{ext.description}</p>
              <p class="text-[9px] text-grow-muted mt-1">
                {ext.input_buds} Buds → {ext.output_wax_g}g Wax
                {#if ext.skip_curing}<span class="text-purple-400 ml-1">Live!</span>{/if}
              </p>
            </div>
            <div class="flex flex-col gap-1 items-end shrink-0 ml-2">
              {#if owned}
                <button on:click={() => gameStore.runExtraction(ext.id)}
                        disabled={!canRun}
                        class="px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95
                               {canRun ? 'bg-yellow-600 text-white' : 'bg-grow-dark text-grow-muted opacity-40'}">
                  Extrahieren
                </button>
              {:else}
                <button on:click={() => buyExtraction(ext.id)}
                        disabled={!affordable || !hasPrereq}
                        class="px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95
                               {affordable && hasPrereq ? 'bg-green-600 text-white' : 'bg-grow-dark text-grow-muted opacity-40'}">
                  {ext.cost_buds} Buds
                </button>
              {/if}
            </div>
          </div>
          {#if !hasPrereq && !owned && ext.requires}
            {@const req = getExtraction(ext.requires)}
            <p class="text-[9px] text-grow-warn mt-1">Benoetigt: {req?.name}</p>
          {/if}
        </div>
      {/each}
    </div>

  <!-- ═══ ZWERG-PACKS-TAB ═══ -->
  {:else if tab === 'zwerge'}
    <div class="space-y-2">
      <p class="text-[10px] text-grow-muted">Zwerg-Packs kosten Buds. Calc-Packs kosten Log-Tokens.</p>

      {#each PACK_DEFS as pack}
        {@const affordable = canAffordZwergPack(pack.tier)}
        <button on:click={() => openZwergPackWithBuds(pack.tier)}
                disabled={!affordable}
                class="w-full card text-left transition-all active:scale-95
                       {affordable ? 'border-grow-primary/40' : 'opacity-40'}">
          <p class="text-xs font-bold">{pack.label}</p>
          <p class="text-[10px] text-grow-muted">{pack.card_count} Karten</p>
          {#if pack.cost === 0}
            <p class="text-[10px] text-grow-primary font-bold mt-1">
              {affordable ? 'GRATIS' : 'Morgen wieder'}
            </p>
          {:else}
            <p class="text-[10px] mt-1 text-green-400">{pack.cost} Buds</p>
          {/if}
        </button>
      {/each}

      <hr class="border-grow-primary/10" />
      <p class="text-[10px] text-purple-400 font-bold">Calc-Packs (Log-Tokens)</p>
      {#each CALC_PACK_DEFS as pack}
        {@const affordable = game.log_tokens >= pack.cost_tokens}
        <button on:click={() => openCalcPack(pack.tier)}
                disabled={!affordable}
                class="w-full card text-left transition-all active:scale-95
                       {affordable ? 'border-purple-400/40' : 'opacity-40'}">
          <p class="text-xs font-bold">{pack.label}</p>
          <p class="text-[10px] text-grow-muted">{pack.card_count} Karten</p>
          <p class="text-[10px] mt-1 text-purple-400">{pack.cost_tokens} Tokens</p>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Seed-Pack Ergebnis Modal -->
{#if showSeedResult}
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
       on:click|self={() => showSeedResult = false}
       on:keydown={e => e.key === 'Escape' && (showSeedResult = false)} role="dialog">
    <div class="w-full max-w-sm card">
      <h3 class="font-pixel text-xs text-grow-primary text-center mb-3">Neue Seeds!</h3>
      <div class="space-y-2">
        {#each seedPackResult as strainId}
          {@const strain = getStrain(strainId)}
          {#if strain}
            <div class="flex items-center justify-between p-2 rounded-lg bg-grow-dark border {
              strain.rarity === 'legendary' ? 'border-yellow-400/40' :
              strain.rarity === 'epic' ? 'border-purple-500/40' :
              strain.rarity === 'rare' ? 'border-grow-water/40' : 'border-grow-muted/30'}">
              <div>
                <p class="text-xs font-bold {RARITY_COLORS[strain.rarity]}">{strain.name}</p>
                <p class="text-[9px] text-grow-muted">{strain.breeder} — {strain.type === 'auto' ? 'Auto' : 'Photo'}</p>
              </div>
              <span class="text-[9px] {RARITY_COLORS[strain.rarity]}">{RARITY_LABELS[strain.rarity]}</span>
            </div>
          {/if}
        {/each}
      </div>
      <button on:click={() => showSeedResult = false}
              class="w-full mt-3 py-2 rounded-xl bg-grow-primary text-grow-dark font-bold active:scale-95">
        Weiter
      </button>
    </div>
  </div>
{/if}
