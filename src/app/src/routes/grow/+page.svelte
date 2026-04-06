<script lang="ts">
  import { gameStore, getGrowProgress, getGrowTimeLeft } from '$lib/stores/growgame';
  import type { GrowSpace, ActiveGrow } from '$lib/stores/growgame';
  import { zwergeStore, getZwerg, getZwergeByRole, RARITY_COLORS } from '$lib/stores/zwerge';
  import { getSpaceDef, ROLE_LABELS, getEquip } from '$lib/data/equipment';
  import type { SpaceType, ZwergRole } from '$lib/data/equipment';
  import { getStrain, PHASE_LABELS } from '$lib/data/strains';
  import type { GrowPhase } from '$lib/data/strains';
  import PixelZwerg from '$lib/components/PixelZwerg.svelte';
  import GrowRoom from '$lib/components/GrowRoom.svelte';
  import { toastStore } from '$lib/stores/toast';
  import { onMount } from 'svelte';

  $: game = $gameStore;
  $: zwerg = $zwergeStore;

  // Tick bei jedem Laden
  onMount(() => { gameStore.tick(); });

  // Interval fuer Live-Updates
  let interval: ReturnType<typeof setInterval>;
  onMount(() => {
    interval = setInterval(() => gameStore.tick(), 60000);
    return () => clearInterval(interval);
  });

  // Ausgewaehlter Space — defensiv gegen undefined Store
  let selectedSpaceId: string = '';
  $: if (game?.spaces?.length && !selectedSpaceId) {
    selectedSpaceId = game.spaces[0].id;
  }
  $: selectedSpace = game?.spaces?.find((sp: GrowSpace) => sp.id === selectedSpaceId) ?? null;
  $: spaceDef = selectedSpace ? getSpaceDef(selectedSpace.type) : null;
  $: activeGrow = game?.grows?.find((g: ActiveGrow) => g.space_id === selectedSpaceId) ?? null;

  // Grow starten
  let plantStrainId = '';
  let plantCount = 1;

  $: availableSeeds = game?.seed_inventory?.filter((si: { strain_id: string; count: number }) => si.count > 0) ?? [];

  function startGrow() {
    if (!plantStrainId || !selectedSpaceId) return;
    const maxPlants = spaceDef?.max_plants ?? 1;
    const seedItem = game.seed_inventory.find(si => si.strain_id === plantStrainId);
    const maxFromSeeds = seedItem?.count ?? 0;
    const count = Math.min(parseInt(String(plantCount), 10) || 1, maxPlants, maxFromSeeds);
    if (count < 1) {
      toastStore.show(0, 'Keine Seeds verfügbar!');
      return;
    }
    const ok = gameStore.startGrow(selectedSpaceId, plantStrainId, count);
    if (ok) {
      toastStore.show(0, `Grow gestartet! ${count}x Pflanzen`);
      plantStrainId = '';
      plantCount = 1;
    } else {
      toastStore.show(0, 'Grow konnte nicht gestartet werden');
    }
  }

  // Zwerg-Zuweisung
  let showDwarfPicker = false;
  let pickingRole: ZwergRole | null = null;

  function openDwarfPicker(role: ZwergRole) {
    pickingRole = role;
    showDwarfPicker = true;
  }

  function assignDwarf(zwergId: number) {
    if (!selectedSpaceId) return;
    gameStore.assignDwarf(selectedSpaceId, zwergId);
    showDwarfPicker = false;
    pickingRole = null;
  }

  function removeDwarf(zwergId: number) {
    if (!selectedSpaceId) return;
    gameStore.removeDwarf(selectedSpaceId, zwergId);
  }

  // Equip installieren
  function installEquip(equipId: string) {
    if (!selectedSpaceId) return;
    gameStore.installEquip(selectedSpaceId, equipId);
  }

  $: ownedEquipNotInstalled = (game?.equipment ?? []).filter((e: { equip_id: string; broken: boolean }) => {
    if (!selectedSpace) return false;
    return !selectedSpace.installed_equip.includes(e.equip_id);
  });

  // Zwerg fuer Rolle finden
  function getDwarfForRole(space: GrowSpace, roleIdx: number): number | null {
    return space.assigned_dwarves[roleIdx] ?? null;
  }

  function getOwnedZwergeForRole(role: ZwergRole): number[] {
    const roleDefs = getZwergeByRole(role);
    return roleDefs
      .filter(d => zwerg.owned.some(o => o.id === d.id))
      .map(d => d.id);
  }

  const PHASE_COLORS: Record<GrowPhase, string> = {
    keimung: 'text-grow-water',
    veg: 'text-grow-primary',
    bluete: 'text-purple-400',
    trocknung: 'text-yellow-400',
    curing: 'text-orange-400',
  };
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="font-pixel text-xs text-grow-primary">GROW</h2>
    <div class="flex items-center gap-3 text-xs">
      <span class="text-green-400 font-bold">{game.buds} Buds</span>
      <span class="text-grow-muted">Ernten: {game.total_harvests}</span>
    </div>
  </div>

  <!-- Space-Auswahl -->
  {#if game.spaces.length > 1}
    <div class="flex gap-1 overflow-x-auto pb-1">
      {#each game.spaces as space}
        {@const def = getSpaceDef(space.type)}
        {@const hasGrow = game.grows.some(g => g.space_id === space.id)}
        <button on:click={() => selectedSpaceId = space.id}
                class="px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-colors
                       {selectedSpaceId === space.id ? 'bg-grow-primary text-grow-dark font-bold' : 'bg-grow-surface text-grow-muted'}">
          {def.label} {hasGrow ? '🌱' : ''}
        </button>
      {/each}
    </div>
  {/if}

  {#if selectedSpace && spaceDef}
    <!-- GrowRoom Grafik — passt sich dem Space-Typ an -->
    <div class="card-glass p-0 overflow-hidden rounded-xl">
      <GrowRoom
        phase={activeGrow?.phase ?? 'veg'}
        woche={1}
        tag={1}
        spaceType={selectedSpace.type}
        zwerge={selectedSpace.assigned_dwarves.filter(d => d != null)} />
      {#if activeGrow}
        {@const progress = getGrowProgress(activeGrow, game.spaces, game.equipment)}
        {@const timeLeft = getGrowTimeLeft(activeGrow, game.spaces, game.equipment)}
        {@const strain = getStrain(activeGrow.strain_id)}
        <div class="px-3 py-2 flex items-center justify-between border-t border-grow-border/10">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold">{strain?.name ?? '?'}</span>
            <span class="text-[10px] font-bold {PHASE_COLORS[activeGrow.phase]}">
              {PHASE_LABELS[activeGrow.phase]}
            </span>
          </div>
          <span class="text-[10px] text-grow-muted">{progress}% — {timeLeft}</span>
        </div>
        <div class="w-full h-1.5 bg-grow-dark">
          <div class="h-full bg-gradient-to-r from-grow-primary to-grow-accent transition-all duration-1000"
               style="width: {progress}%"></div>
        </div>
      {:else}
        <div class="px-3 py-2 text-center">
          <span class="text-[10px] text-grow-muted">Kein aktiver Grow — starte einen unten</span>
        </div>
      {/if}
    </div>

    <!-- Space Info -->
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold">{spaceDef.label}</h3>
        <span class="text-[10px] text-grow-muted">Max {spaceDef.max_plants} Pflanzen</span>
      </div>

      <!-- Installiertes Equipment -->
      {#if selectedSpace.installed_equip.length > 0}
        <div class="flex flex-wrap gap-1 mb-2">
          {#each selectedSpace.installed_equip as eid}
            {@const eq = getEquip(eid)}
            {@const owned = game.equipment.find(e => e.equip_id === eid)}
            {#if eq}
              <span class="text-[9px] px-1.5 py-0.5 rounded
                           {owned?.broken ? 'bg-red-500/20 text-red-400' : 'bg-grow-primary/10 text-grow-muted'}">
                {eq.name} {owned?.broken ? '(defekt)' : ''}
              </span>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Equipment installieren -->
      {#if ownedEquipNotInstalled.length > 0}
        <div class="mb-2">
          <p class="text-[9px] text-grow-muted mb-1">Equipment installieren:</p>
          <div class="flex flex-wrap gap-1">
            {#each ownedEquipNotInstalled as eq}
              {@const def = getEquip(eq.equip_id)}
              {#if def}
                <button on:click={() => installEquip(eq.equip_id)}
                        class="text-[9px] px-2 py-1 rounded bg-grow-surface text-grow-muted
                               hover:bg-grow-primary/20 active:scale-95 transition-all">
                  + {def.name}
                </button>
              {/if}
            {/each}
          </div>
        </div>
      {/if}

      <!-- Zwerg-Rollen -->
      <div class="space-y-1.5">
        <p class="text-[9px] text-grow-muted uppercase">Zwerge</p>
        {#each spaceDef.required_roles as role, idx}
          {@const dwId = getDwarfForRole(selectedSpace, idx)}
          {@const dwDef = dwId ? getZwerg(dwId) : null}
          <div class="flex items-center justify-between p-2 rounded-lg bg-grow-dark/50 border border-grow-border/20">
            <div class="flex items-center gap-2">
              {#if dwDef && dwId}
                <PixelZwerg id={dwId} size={24} animate={true} />
                <div>
                  <p class="text-[10px] font-bold {RARITY_COLORS[dwDef.rarity]}">{dwDef.name}</p>
                  <p class="text-[9px] text-grow-muted">{ROLE_LABELS[role]}</p>
                </div>
              {:else}
                <span class="text-xl opacity-30">👤</span>
                <p class="text-[10px] text-grow-muted">{ROLE_LABELS[role]} — frei</p>
              {/if}
            </div>
            {#if dwId}
              <button on:click={() => removeDwarf(dwId)}
                      class="text-[9px] text-grow-danger px-2 py-1 rounded active:scale-95">✕</button>
            {:else}
              <button on:click={() => openDwarfPicker(role)}
                      class="text-[9px] text-grow-primary px-2 py-1 rounded bg-grow-primary/10 active:scale-95">
                Zuweisen
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Aktiver Grow Details -->
    {#if activeGrow}
      {@const strain = getStrain(activeGrow.strain_id)}
      <div class="card border-grow-primary/20">
        <div class="flex items-center justify-between">
          <p class="text-[10px] text-grow-muted">{strain?.breeder} — {activeGrow.plant_count}x Pflanzen</p>
          {#if activeGrow.live_extraction}
            <span class="text-[9px] text-purple-400">Live-Extraction aktiv</span>
          {/if}
        </div>
      </div>

    <!-- Neuen Grow starten -->
    {:else}
      <div class="card">
        <h3 class="text-xs text-grow-muted uppercase mb-3">Neuen Grow starten</h3>

        {#if availableSeeds.length === 0}
          <p class="text-xs text-grow-muted text-center py-4">
            Keine Seeds vorhanden. <a href="/shop" class="text-grow-primary underline">Zum Shop</a>
          </p>
        {:else if selectedSpace.assigned_dwarves.length < 1}
          <p class="text-xs text-grow-warn text-center py-4">
            Mindestens 1 Zwerg muss zugewiesen sein!
          </p>
        {:else}
          <div class="space-y-3">
            <div>
              <label class="text-[10px] text-grow-muted uppercase block mb-1" for="strain-select">Strain</label>
              <select id="strain-select" bind:value={plantStrainId}
                      class="w-full bg-grow-dark border border-grow-border/30 rounded-lg px-3 py-2 text-sm">
                <option value="">Strain waehlen...</option>
                {#each availableSeeds as si}
                  {@const strain = getStrain(si.strain_id)}
                  {#if strain}
                    <option value={si.strain_id}>{strain.name} ({strain.breeder}) x{si.count}</option>
                  {/if}
                {/each}
              </select>
            </div>

            {#if plantStrainId}
              {@const maxSeeds = game.seed_inventory.find(si => si.strain_id === plantStrainId)?.count ?? 0}
              {@const maxPlants = Math.min(spaceDef.max_plants, maxSeeds)}
              <div>
                <label class="text-[10px] text-grow-muted uppercase block mb-1" for="plant-count">
                  Anzahl Pflanzen (max {maxPlants})
                </label>
                <input id="plant-count" type="number" bind:value={plantCount}
                       min="1" max={maxPlants}
                       class="w-full bg-grow-dark border border-grow-border/30 rounded-lg px-3 py-2 text-sm" />
              </div>

              {@const strain = getStrain(plantStrainId)}
              {#if strain}
                <div class="text-[10px] text-grow-muted space-y-0.5">
                  <p>Typ: {strain.type === 'auto' ? 'Automatic' : 'Photoperiodisch'}</p>
                  <p>Ertrag: {strain.yield_min}g – {strain.yield_max}g pro Pflanze</p>
                  <p>Dauer: {strain.type === 'auto' ? '10' : '14'} Tage</p>
                </div>
              {/if}
            {/if}

            <button on:click={startGrow}
                    disabled={!plantStrainId || plantCount < 1}
                    class="w-full py-3 rounded-xl bg-grow-primary text-grow-dark font-bold
                           active:scale-95 transition-all disabled:opacity-30">
              Grow starten
            </button>
          </div>
        {/if}
      </div>
    {/if}

  {:else}
    <div class="card text-center py-8">
      <p class="text-grow-muted">Kein Space vorhanden</p>
    </div>
  {/if}
</div>

<!-- Zwerg-Picker Modal -->
{#if showDwarfPicker && pickingRole}
  <div class="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-4"
       on:click|self={() => showDwarfPicker = false}
       on:keydown={e => e.key === 'Escape' && (showDwarfPicker = false)} role="dialog">
    <div class="w-full max-w-sm card mb-20 max-h-[60vh] overflow-y-auto">
      <h3 class="font-pixel text-xs text-grow-primary mb-3">{ROLE_LABELS[pickingRole]} waehlen</h3>
      {#if getOwnedZwergeForRole(pickingRole).length === 0}
        <p class="text-xs text-grow-muted text-center py-4">
          Keine Zwerge mit dieser Rolle vorhanden.<br/>
          <a href="/shop" class="text-grow-primary underline">Zwerg-Packs kaufen</a>
        </p>
      {:else}
        <div class="space-y-2">
          {#each getOwnedZwergeForRole(pickingRole) as zid}
            {@const def = getZwerg(zid)}
            {@const owned = zwerg.owned.find(o => o.id === zid)}
            {#if def}
              <button on:click={() => assignDwarf(zid)}
                      class="w-full flex items-center gap-3 p-2 rounded-lg bg-grow-dark border border-grow-border/20
                             hover:border-grow-primary/40 active:scale-95 transition-all text-left">
                <PixelZwerg id={zid} size={32} />
                <div class="flex-1">
                  <p class="text-xs font-bold {RARITY_COLORS[def.rarity]}">{def.name}</p>
                  <p class="text-[9px] text-grow-muted">{def.rolle} — Lv.{owned?.level ?? 1}</p>
                  <p class="text-[9px] text-grow-accent">{def.buff_label}</p>
                </div>
              </button>
            {/if}
          {/each}
        </div>
      {/if}
      <button on:click={() => showDwarfPicker = false}
              class="w-full mt-3 py-2 rounded-lg border border-grow-primary/20 text-grow-muted text-xs">
        Abbrechen
      </button>
    </div>
  </div>
{/if}
