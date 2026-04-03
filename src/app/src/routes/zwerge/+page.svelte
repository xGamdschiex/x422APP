<script lang="ts">
  import {
    zwergeStore, dailyAvailable, collectionCount,
    ZWERG_DEFS, PACK_DEFS, RARITY_LABELS, RARITY_COLORS, RARITY_BG,
    KOMPOST_VALUES, getZwerg, cardsForLevel, MAX_ZWERG_LEVEL, buffWithLevel,
    type Rarity, type PackTier, type ZwergDef,
  } from '$lib/stores/zwerge';
  import { gameStore } from '$lib/stores/growgame';
  import { ROLE_LABELS } from '$lib/data/equipment';
  import PixelZwerg from '$lib/components/PixelZwerg.svelte';

  $: state = $zwergeStore;
  $: game = $gameStore;
  $: canDaily = $dailyAvailable;
  $: collected = $collectionCount;

  // Filter
  type FilterType = Rarity | 'all' | 'roles';
  let filter: FilterType = 'all';
  $: filteredDefs = filter === 'all'
    ? ZWERG_DEFS
    : filter === 'roles'
      ? ZWERG_DEFS.filter(z => z.grow_role)
      : ZWERG_DEFS.filter(z => z.rarity === filter);

  // Karten-Detail
  let selectedZwerg: ZwergDef | null = null;
  $: selectedOwned = selectedZwerg ? state.owned.find(o => o.id === selectedZwerg!.id) : undefined;
  $: selectedActive = selectedZwerg ? state.active_ids.includes(selectedZwerg.id) : false;

  function getOwned(id: number) {
    return state.owned.find(o => o.id === id);
  }

  function isActive(id: number) {
    return state.active_ids.includes(id);
  }

  // Pack-Oeffnung (Daily gratis, Rest kostet Buds)
  let packResult: number[] = [];
  let packOpening = false;
  let packRevealed = false;

  function openPack(tier: PackTier) {
    if (tier !== 'daily') {
      const effectiveCost = zwergeStore.getEffectiveCost(state, tier);
      if (game.buds < effectiveCost) return;
      gameStore.addBuds(-effectiveCost);
    }
    const result = zwergeStore.openPack(tier, tier !== 'daily');
    if (result.length === 0) return;
    packResult = result;
    packOpening = true;
    packRevealed = false;
  }

  function revealPack() { packRevealed = true; }
  function closePack() { packOpening = false; packResult = []; packRevealed = false; }

  function canAfford(tier: PackTier): boolean {
    if (tier === 'daily') return canDaily;
    const pack = PACK_DEFS.find(p => p.tier === tier);
    if (!pack) return false;
    return game.buds >= pack.cost;
  }

  const RARITY_STAR: Record<Rarity, string> = {
    common: '',
    rare: '★',
    epic: '★★',
    legendary: '★★★',
  };
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="font-pixel text-xs text-grow-primary">ZWERGE</h2>
    <div class="flex items-center gap-3">
      <span class="text-green-400 text-xs font-bold">{game.buds} Buds</span>
    </div>
  </div>

  <!-- Fortschritt -->
  <div class="card">
    <div class="flex justify-between text-xs text-grow-muted mb-2">
      <span>Sammlung</span>
      <span>{collected} / {ZWERG_DEFS.length}</span>
    </div>
    <div class="w-full bg-grow-dark rounded-full h-2 overflow-hidden">
      <div class="h-full bg-grow-primary rounded-full transition-all duration-500"
           style="width: {(collected / ZWERG_DEFS.length) * 100}%"></div>
    </div>
    <div class="flex justify-between text-[10px] text-grow-muted mt-1">
      <span>Streak: {state.login_streak}d</span>
      <span>Packs: {state.total_packs_opened}</span>
    </div>
  </div>

  <!-- Pack-Shop -->
  <div class="card">
    <h3 class="text-xs text-grow-muted uppercase mb-3">Packs (kosten Buds)</h3>
    <div class="grid grid-cols-2 gap-2">
      {#each PACK_DEFS as pack}
        {@const affordable = canAfford(pack.tier)}
        <button
          on:click={() => openPack(pack.tier)}
          disabled={!affordable}
          class="p-3 rounded-xl border text-left transition-all active:scale-95
                 {affordable
                   ? 'border-grow-primary/40 bg-grow-dark hover:bg-grow-primary/10'
                   : 'border-grow-muted/20 bg-grow-dark/50 opacity-40'}"
        >
          <p class="text-xs font-bold truncate">{pack.label}</p>
          <p class="text-[10px] text-grow-muted">{pack.card_count} Karten</p>
          {#if pack.cost === 0}
            <p class="text-[10px] text-grow-primary font-bold mt-1">
              {canDaily ? 'GRATIS' : 'Morgen wieder'}
            </p>
          {:else}
            <p class="text-[10px] mt-1 {affordable ? 'text-green-400' : 'text-grow-muted'}">
              {pack.cost} Buds
            </p>
          {/if}
          {#if pack.guaranteed_rarity}
            <p class="text-[9px] text-grow-accent mt-0.5">1x {RARITY_LABELS[pack.guaranteed_rarity]} sicher</p>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Aktive Brigade -->
  {#if state.active_ids.length > 0}
    <div class="card">
      <h3 class="text-xs text-grow-muted uppercase mb-2">Raum-Zwerge ({state.active_ids.length}/6)</h3>
      <div class="grid grid-cols-3 gap-2">
        {#each state.active_ids as aid}
          {@const def = getZwerg(aid)}
          {@const owned = getOwned(aid)}
          {#if def}
            <div class="p-2 rounded-lg bg-grow-dark border {RARITY_BG[def.rarity]} text-center">
              <div class="flex justify-center mb-1"><PixelZwerg id={aid} size={28} animate={true} /></div>
              <p class="text-[10px] font-bold truncate">{def.name}</p>
              <p class="text-[9px] text-grow-muted truncate">Lv.{owned?.level ?? 1}</p>
              {#if def.grow_role}
                <p class="text-[8px] text-grow-accent truncate">{ROLE_LABELS[def.grow_role]}</p>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Filter -->
  <div class="flex gap-1 overflow-x-auto pb-1">
    <button on:click={() => filter = 'all'}
            class="px-3 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors
                   {filter === 'all' ? 'bg-grow-primary text-grow-dark font-bold' : 'bg-grow-surface text-grow-muted'}">
      Alle ({ZWERG_DEFS.length})
    </button>
    <button on:click={() => filter = 'roles'}
            class="px-3 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors
                   {filter === 'roles' ? 'bg-grow-primary text-grow-dark font-bold' : 'bg-grow-surface text-grow-muted'}">
      Rollen
    </button>
    {#each ['common', 'rare', 'epic', 'legendary'] as r}
      {@const count = state.owned.filter(o => getZwerg(o.id)?.rarity === r).length}
      <button on:click={() => filter = r}
              class="px-3 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors
                     {filter === r ? 'bg-grow-primary text-grow-dark font-bold' : 'bg-grow-surface text-grow-muted'}">
        {RARITY_LABELS[r]} ({count})
      </button>
    {/each}
  </div>

  <!-- Karten-Grid -->
  <div class="grid grid-cols-3 gap-2">
    {#each filteredDefs as def}
      {@const owned = getOwned(def.id)}
      {@const active = isActive(def.id)}
      <button
        on:click={() => selectedZwerg = def}
        class="p-2 rounded-xl border text-center transition-all active:scale-95 relative
               {owned
                 ? `bg-grow-dark ${RARITY_BG[def.rarity]} ${active ? 'ring-2 ring-grow-primary' : ''}`
                 : 'bg-grow-dark/30 border-grow-muted/10 opacity-40'}"
      >
        <div class="flex justify-center mb-1">
          {#if owned}
            <PixelZwerg id={def.id} size={32} animate={active} />
          {:else}
            <span class="text-2xl">❓</span>
          {/if}
        </div>
        <p class="text-[10px] font-bold truncate {owned ? RARITY_COLORS[def.rarity] : 'text-grow-muted'}">
          {owned ? def.name : '???'}
        </p>
        <p class="text-[9px] {RARITY_COLORS[def.rarity]}">{RARITY_STAR[def.rarity] || '·'}</p>
        {#if owned}
          <span class="absolute top-1 right-1 text-[8px] bg-grow-surface px-1 rounded text-grow-accent font-bold">
            Lv.{owned.level}
          </span>
        {/if}
        {#if active}
          <span class="absolute top-1 left-1 text-[9px]">✓</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<!-- Pack-Oeffnungs-Modal -->
{#if packOpening}
  <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
       on:click|self={closePack} on:keydown={e => e.key === 'Escape' && closePack()} role="dialog">
    <div class="w-full max-w-sm">
      {#if !packRevealed}
        <button on:click={revealPack}
                class="w-full card border-grow-primary/60 text-center py-12
                       hover:scale-105 active:scale-95 transition-transform animate-pulse">
          <p class="text-5xl mb-4">📦</p>
          <p class="font-pixel text-xs text-grow-primary">ANTIPPEN</p>
          <p class="text-[10px] text-grow-muted mt-1">{packResult.length} Karten warten</p>
        </button>
      {:else}
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            {#each packResult as cardId, i}
              {@const def = getZwerg(cardId)}
              {@const ownedEntry = state.owned.find(o => o.id === cardId)}
              {@const isNew = !ownedEntry || ownedEntry.count === 1}
              {#if def}
                <div class="card border {RARITY_BG[def.rarity]} text-center p-3
                            animate-card-reveal"
                     style="animation-delay: {i * 120}ms">
                  <div class="flex justify-center mb-1"><PixelZwerg id={cardId} size={32} /></div>
                  <p class="text-[10px] font-bold {RARITY_COLORS[def.rarity]} truncate">{def.name}</p>
                  <p class="text-[9px] {RARITY_COLORS[def.rarity]}">{RARITY_LABELS[def.rarity]}</p>
                  {#if !isNew}
                    <p class="text-[9px] text-yellow-400 mt-1">+{KOMPOST_VALUES[def.rarity]}</p>
                  {:else}
                    <p class="text-[9px] text-grow-primary mt-1">NEU!</p>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
          <button on:click={closePack}
                  class="w-full py-3 rounded-xl bg-grow-primary text-grow-dark font-bold
                         active:scale-95 transition-transform">
            Weiter
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Karten-Detail-Modal -->
{#if selectedZwerg}
  <div class="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-4"
       on:click|self={() => selectedZwerg = null}
       on:keydown={e => e.key === 'Escape' && (selectedZwerg = null)} role="dialog">
    <div class="w-full max-w-sm card border {RARITY_BG[selectedZwerg.rarity]} mb-20">
      <div class="text-center">
        <div class="flex justify-center mb-3"><PixelZwerg id={selectedZwerg.id} size={64} animate={true} /></div>
        <h3 class="font-pixel text-xs {RARITY_COLORS[selectedZwerg.rarity]}">{selectedZwerg.name}</h3>
        <p class="text-xs text-grow-muted mt-1">{selectedZwerg.rolle}</p>
        <p class="text-[10px] {RARITY_COLORS[selectedZwerg.rarity]} mt-1">
          {RARITY_STAR[selectedZwerg.rarity]} {RARITY_LABELS[selectedZwerg.rarity]}
        </p>
        {#if selectedZwerg.grow_role}
          <p class="text-[10px] text-grow-accent mt-1">Rolle: {ROLE_LABELS[selectedZwerg.grow_role]}</p>
        {/if}
      </div>

      <hr class="border-grow-primary/10 my-3" />

      <div class="text-center">
        <p class="text-[10px] text-grow-muted uppercase mb-1">Buff</p>
        <p class="text-sm font-bold text-grow-accent">{selectedZwerg.buff_label}</p>
      </div>

      {#if selectedOwned}
        <hr class="border-grow-primary/10 my-3" />
        <!-- Level-Anzeige -->
        <div class="text-center mb-3">
          <p class="text-xs font-bold text-grow-accent">Level {selectedOwned.level} / {MAX_ZWERG_LEVEL}</p>
          <p class="text-[10px] text-grow-muted">
            Karten: {selectedOwned.count} / {selectedOwned.level < MAX_ZWERG_LEVEL ? cardsForLevel(selectedOwned.level) : 'MAX'}
          </p>
          {#if selectedOwned.level < MAX_ZWERG_LEVEL}
            <div class="w-full bg-grow-dark rounded-full h-1.5 overflow-hidden mt-1">
              <div class="h-full bg-grow-accent rounded-full transition-all"
                   style="width: {Math.min(100, (selectedOwned.count / cardsForLevel(selectedOwned.level)) * 100)}%"></div>
            </div>
          {/if}
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-grow-muted">Besitzt: x{selectedOwned.count}</span>
          <button
            on:click={() => { if (selectedZwerg) zwergeStore.toggleActive(selectedZwerg.id); }}
            class="px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95
                   {selectedActive
                     ? 'bg-grow-primary/20 text-grow-primary border border-grow-primary/40'
                     : state.active_ids.length >= 6
                       ? 'bg-grow-dark text-grow-muted border border-grow-muted/20'
                       : 'bg-grow-primary text-grow-dark'}"
            disabled={!selectedActive && state.active_ids.length >= 6}
          >
            {selectedActive ? 'Deaktivieren' : state.active_ids.length >= 6 ? 'Raum voll' : 'In Raum setzen'}
          </button>
        </div>
      {:else}
        <hr class="border-grow-primary/10 my-3" />
        <p class="text-center text-xs text-grow-muted">Noch nicht gesammelt</p>
      {/if}

      <button on:click={() => selectedZwerg = null}
              class="w-full mt-3 py-2 rounded-lg border border-grow-primary/20 text-grow-muted text-xs">
        Schliessen
      </button>
    </div>
  </div>
{/if}

<style>
  @keyframes card-reveal {
    0% { opacity: 0; transform: scale(0.5) rotateY(180deg); }
    60% { transform: scale(1.1) rotateY(0deg); }
    100% { opacity: 1; transform: scale(1) rotateY(0deg); }
  }
  .animate-card-reveal {
    animation: card-reveal 0.5s ease-out both;
  }
</style>
