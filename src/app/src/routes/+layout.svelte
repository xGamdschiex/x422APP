<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user';
  import { getFeedLine } from '$lib/calc/feedlines/registry';
  import { zwergeStore } from '$lib/stores/zwerge';
  import { gameStore } from '$lib/stores/growgame';
  import { authStore, isLoggedIn } from '$lib/stores/auth';
  import { fetchGamification, isApiConfigured } from '$lib/api/sheets';
  import SeedToast from '$lib/components/SeedToast.svelte';

  // Login-Guard: Alle Routen außer /login erfordern Auth
  $: if (typeof window !== 'undefined' && !$isLoggedIn && $page.url.pathname !== '/login') {
    goto('/login');
  }

  onMount(async () => {
    // Seeds VOR Migration erfassen (migrateToV2 setzt seeds auf 0)
    const oldSeeds = $zwergeStore.seeds;
    // V2 Migration + Starter Pack
    zwergeStore.migrateToV2();
    const zState = $zwergeStore;
    if (!zState.v2_migrated || zState.owned.length === 0) {
      zwergeStore.grantStarterPack();
    }
    // Alte Seeds → Buds konvertieren (einmalig, da migrateToV2 seeds nullt)
    if (oldSeeds > 0) {
      gameStore.migrateFromOldSeeds(oldSeeds);
    }
    // Grow-Ticks ausfuehren (Offline-Progression)
    gameStore.tick();
    // Daily Seed Check
    gameStore.dailySeedCheck();

    if ($isLoggedIn && $authStore?.email && isApiConfigured()) {
      try {
        const result = await fetchGamification($authStore.email);
        if (result.ok && result.data) {
          zwergeStore.loadFromSheet(result.data);
        }
      } catch { /* offline — localStorage bleibt */ }
    }
  });

  $: activeLine = getFeedLine($userStore.feedline);
  $: lineLabel = activeLine ? activeLine.name.split('—')[0].trim() : '';
  $: buds = $gameStore.buds;
  $: wax = $gameStore.wax;
  $: auth = $authStore;
  $: loggedIn = $isLoggedIn;

  const nav = [
    { href: '/',         icon: '🌱', label: 'Home' },
    { href: '/grow',     icon: '🌿', label: 'Grow' },
    { href: '/calc',     icon: '🧮', label: 'Calc' },
    { href: '/shop',     icon: '🛒', label: 'Shop' },
    { href: '/zwerge',   icon: '⛏️', label: 'Zwerge' },
  ];
</script>

<div class="h-screen bg-grow-dark text-grow-text flex flex-col overflow-hidden">
  <!-- Header -->
  <header class="flex items-center justify-between px-4 py-3 bg-grow-surface/80 backdrop-blur border-b border-grow-primary/20">
    <h1 class="font-pixel text-xs text-grow-primary tracking-wider">x422</h1>
    <div class="flex items-center gap-3">
      <span class="text-[10px] text-grow-muted truncate max-w-[20vw]">{lineLabel}</span>
      <span class="flex items-center gap-1 text-[10px] text-green-400 font-bold">
        {buds}B
      </span>
      {#if wax > 0}
        <span class="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
          {wax}g
        </span>
      {/if}
      {#if loggedIn && auth}
        <a href="/settings" class="w-6 h-6 rounded-full overflow-hidden border border-grow-primary/40 shrink-0">
          {#if auth.picture}
            <img src={auth.picture} alt="" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
          {:else}
            <span class="flex items-center justify-center w-full h-full bg-grow-primary/20 text-[10px] text-grow-primary font-bold">
              {auth.name.charAt(0).toUpperCase()}
            </span>
          {/if}
        </a>
      {:else}
        <a href="/login" class="text-[10px] text-grow-muted hover:text-grow-accent">Login</a>
      {/if}
    </div>
  </header>

  <!-- Main content -->
  <main class="flex-1 min-h-0 px-4 py-4 pb-nav overflow-y-auto">
    <slot />
  </main>

  <!-- Bottom Navigation -->
  <nav class="fixed bottom-0 left-0 right-0 bg-grow-surface/95 backdrop-blur border-t border-grow-primary/20 safe-bottom">
    <div class="flex justify-around items-center h-16 max-w-lg mx-auto">
      {#each nav as item}
        <a
          href={item.href}
          class="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors
                 {$page.url.pathname === item.href
                   ? 'text-grow-primary'
                   : 'text-grow-muted hover:text-grow-text'}"
        >
          <span class="text-xl">{item.icon}</span>
          <span class="text-[10px] font-pixel">{item.label}</span>
        </a>
      {/each}
    </div>
  </nav>

  <SeedToast />
</div>

<style>
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
</style>
