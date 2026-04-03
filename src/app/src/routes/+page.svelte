<script lang="ts">
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';
  import { calcStore } from '$lib/stores/calc';
  import { onlineStore, queueCountStore } from '$lib/stores/sync';
  import { getFeedLine } from '$lib/calc/feedlines/registry';
  import { calcGrowDay, calcTotalDays } from '$lib/calc/feedlines/types';
  import { zwergeStore, dailyAvailable, ZWERG_DEFS } from '$lib/stores/zwerge';
  import { gameStore, getGrowProgress, getGrowTimeLeft } from '$lib/stores/growgame';
  import { getStrain, PHASE_LABELS } from '$lib/data/strains';
  import type { GrowPhase } from '$lib/data/strains';
  import { getSpaceDef } from '$lib/data/equipment';
  import GrowRoom from '$lib/components/GrowRoom.svelte';

  $: prefs = $userStore;
  $: gamification = $zwergeStore;
  $: game = $gameStore;
  $: canDaily = $dailyAvailable;

  onMount(() => {
    zwergeStore.checkDailyLogin();
    gameStore.tick();
  });

  $: calc = $calcStore;
  $: feedline = getFeedLine(prefs.feedline);
  $: totalDays = feedline ? calcTotalDays(feedline) : 105;
  $: day = feedline ? calcGrowDay(feedline, prefs.phase, prefs.woche, prefs.tag) : 1;
  $: progress = totalDays > 0 ? Math.round((day / totalDays) * 100) : 0;
  $: phasenNames = feedline ? feedline.phasen.map(p => p.name) : ['Clone', 'Veg', 'Bloom'];
  $: online = $onlineStore;
  $: queueCount = $queueCountStore;
  $: schemaHinweis = calc.result?.schema?.hinweis ?? '';

  // Raum-Zwerge (bis zu 6)
  $: roomZwerge = gamification.active_ids.slice(0, 6);

  function phaseGradient(phase: string): string {
    const p = phase.toLowerCase();
    if (p === 'clone') return 'from-grow-water/80 to-grow-water';
    if (p === 'veg') return 'from-grow-primary/80 to-grow-accent';
    if (p === 'bloom') return 'from-purple-600 to-purple-400';
    if (p === 'flush') return 'from-gray-500 to-gray-400';
    return 'from-grow-primary/80 to-grow-accent';
  }

  const PHASE_COLORS: Record<string, string> = {
    keimung: 'text-grow-water',
    veg: 'text-grow-primary',
    bluete: 'text-purple-400',
    trocknung: 'text-yellow-400',
    curing: 'text-orange-400',
  };
</script>

<div class="space-y-3">
  <!-- ===== GROW ROOM (Calc-Visualisierung) ===== -->
  <div class="card-glass p-0 overflow-hidden">
    <GrowRoom phase={prefs.phase} woche={prefs.woche} tag={prefs.tag}
             zwerge={roomZwerge} />
    <div class="flex items-center justify-center gap-3 py-2">
      <span class="px-3 py-1 rounded-full text-[10px] font-pixel font-bold
                   bg-gradient-to-r {phaseGradient(prefs.phase)} text-white shadow-lg">
        {prefs.phase} W{prefs.woche}
      </span>
      <span class="text-[11px] text-grow-muted">
        Tag {day} / {totalDays}
      </span>
    </div>
  </div>

  <!-- ===== AKTIVE GROWS (Game) ===== -->
  {#if game.grows.length > 0}
    <div class="card-glass">
      <h3 class="text-[10px] text-grow-muted uppercase mb-2">Aktive Grows</h3>
      <div class="space-y-2">
        {#each game.grows as grow}
          {@const strain = getStrain(grow.strain_id)}
          {@const prog = getGrowProgress(grow)}
          {@const timeLeft = getGrowTimeLeft(grow)}
          {@const space = game.spaces.find(sp => sp.id === grow.space_id)}
          <div class="p-2 rounded-lg bg-grow-dark/50 border border-grow-border/20">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold">{strain?.name ?? '?'}</span>
              <span class="text-[10px] font-bold {PHASE_COLORS[grow.phase] ?? 'text-grow-muted'}">
                {PHASE_LABELS[grow.phase as GrowPhase] ?? grow.phase}
              </span>
            </div>
            <div class="w-full bg-grow-dark rounded-full h-1.5 overflow-hidden mb-1">
              <div class="h-full rounded-full bg-gradient-to-r from-grow-primary to-grow-accent transition-all"
                   style="width: {prog}%"></div>
            </div>
            <div class="flex justify-between text-[9px] text-grow-muted">
              <span>{space ? getSpaceDef(space.type).label : ''} — {grow.plant_count}x</span>
              <span>{timeLeft}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <a href="/grow" class="card-glass block text-center py-3 border-dashed border-grow-primary/30 hover:border-grow-primary/60 transition-colors">
      <p class="text-xs text-grow-muted">Kein aktiver Grow</p>
      <p class="text-[10px] text-grow-primary mt-1">Grow starten →</p>
    </a>
  {/if}

  <!-- Calc Progress Bar -->
  <div class="card-glass">
    <div class="flex justify-between text-xs text-grow-muted mb-2">
      <span class="font-bold">Calc Fortschritt</span>
      <span class="font-pixel text-grow-accent">{progress}%</span>
    </div>
    <div class="w-full bg-grow-dark/60 rounded-full h-3 overflow-hidden shadow-inner">
      <div
        class="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r {phaseGradient(prefs.phase)} relative"
        style="width: {progress}%"
      >
        <div class="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    </div>
    <div class="flex justify-between text-[10px] text-grow-muted/70 mt-1.5">
      {#each phasenNames as ph}
        <span class="transition-colors" class:text-grow-text={ph.toLowerCase() === prefs.phase.toLowerCase()}
              class:font-bold={ph.toLowerCase() === prefs.phase.toLowerCase()}>
          {ph}
        </span>
      {/each}
    </div>
  </div>

  <!-- Status Cards -->
  <div class="grid grid-cols-2 gap-2.5">
    <div class="card-glass group">
      <p class="text-[9px] text-grow-muted uppercase tracking-widest mb-1">Buds</p>
      <p class="text-xl font-bold text-green-400">{game.buds}</p>
      <p class="text-[9px] text-grow-muted">Ernten: {game.total_harvests}</p>
    </div>
    <div class="card-glass group">
      <p class="text-[9px] text-grow-muted uppercase tracking-widest mb-1">Wax</p>
      <p class="text-xl font-bold text-yellow-400">{game.wax}g</p>
      <p class="text-[9px] text-grow-muted">{Math.round(game.wax * 100)} Buds Wert</p>
    </div>
    {#if calc.result}
      <div class="card-glass group">
        <p class="text-[9px] text-grow-muted uppercase tracking-widest mb-1">EC-Soll</p>
        <p class="text-xl font-bold text-grow-accent">{calc.result.ec_soll}</p>
        <p class="text-[9px] text-grow-muted">{prefs.ec_einheit}</p>
      </div>
      <div class="card-glass group">
        <p class="text-[9px] text-grow-muted uppercase tracking-widest mb-1">pH-Ziel</p>
        <p class="text-xl font-bold text-grow-water">{calc.result.ph_ziel}</p>
      </div>
    {/if}
  </div>

  <!-- Schema-Hinweis -->
  {#if schemaHinweis}
    <div class="card-glass border-grow-warn/30 flex items-start gap-2">
      <span class="text-grow-warn text-sm mt-0.5 shrink-0">!</span>
      <p class="text-[11px] text-grow-warn leading-relaxed">{schemaHinweis}</p>
    </div>
  {/if}

  <!-- Zwerge + Streak + Quick-Links -->
  <div class="card-glass flex items-center justify-between">
    <div class="flex items-center gap-3">
      {#if gamification.login_streak > 0}
        <div class="flex items-center gap-1.5 bg-grow-dark/40 rounded-full px-2.5 py-1">
          <span class="text-sm">{gamification.login_streak >= 7 ? '🔥🔥' : '🔥'}</span>
          <span class="text-xs font-bold text-grow-text">{gamification.login_streak}d</span>
        </div>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      {#if canDaily}
        <a href="/zwerge" class="text-[10px] text-yellow-400 font-bold animate-pulse
                                 bg-yellow-400/10 rounded-full px-2.5 py-1">
          Gratis-Pack!
        </a>
      {/if}
      <a href="/zwerge" class="flex items-center gap-1.5 text-[10px] text-grow-muted
                               hover:text-grow-accent transition-colors">
        <span>{gamification.owned.length}/{ZWERG_DEFS.length} Zwerge</span>
      </a>
    </div>
  </div>

  <!-- Quick Nav -->
  <div class="grid grid-cols-3 gap-2">
    <a href="/mix" class="card-glass text-center py-3 hover:border-grow-primary/40 transition-colors">
      <span class="text-lg">🧪</span>
      <p class="text-[10px] text-grow-muted mt-1">Mix</p>
    </a>
    <a href="/log" class="card-glass text-center py-3 hover:border-grow-primary/40 transition-colors">
      <span class="text-lg">📋</span>
      <p class="text-[10px] text-grow-muted mt-1">Log</p>
    </a>
    <a href="/settings" class="card-glass text-center py-3 hover:border-grow-primary/40 transition-colors">
      <span class="text-lg">⚙️</span>
      <p class="text-[10px] text-grow-muted mt-1">Setup</p>
    </a>
  </div>

  <!-- Sync Status -->
  <div class="card-glass flex items-center justify-between text-xs">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full shadow-sm {online ? 'bg-grow-primary shadow-grow-primary/50' : 'bg-grow-danger shadow-grow-danger/50'}"></span>
      <span class="text-grow-muted">{online ? 'Online' : 'Offline'}</span>
    </div>
    {#if queueCount > 0}
      <span class="badge-warn">{queueCount} ausstehend</span>
    {/if}
  </div>

  {#if calc.error}
    <div class="card-glass border-grow-danger/40">
      <p class="text-grow-danger text-sm">{calc.error}</p>
    </div>
  {/if}
</div>

<style>
  .font-pixel {
    font-family: 'Press Start 2P', monospace;
  }
</style>
