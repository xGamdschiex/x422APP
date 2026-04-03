<script lang="ts">
  import { calcStore } from '$lib/stores/calc';
  import { buildMixUI, totalSteps } from '$lib/calc/mix';
  import { zwergeStore } from '$lib/stores/zwerge';
  import { gameStore } from '$lib/stores/growgame';

  let currentStep = 0;

  $: calc = $calcStore;
  $: steps = calc.result ? buildMixUI(calc.result, currentStep) : [];
  $: total = calc.result ? totalSteps(calc.result) : 0;
  $: isDone = currentStep >= total;

  let mixRewarded = false;

  function next() {
    if (currentStep < total) currentStep++;
    if (currentStep >= total && !mixRewarded) {
      mixRewarded = true;
      zwergeStore.earnSeeds(1, ['mix_complete']);
      zwergeStore.trackMix();
      gameStore.addBuds(5);
      gameStore.addLogTokens(1);
    }
  }

  function prev() {
    if (currentStep > 0) currentStep--;
  }

  function reset() {
    currentStep = 0;
    mixRewarded = false;
  }

  const STEP_EMOJIS: Record<string, string> = {
    'droplet': '💧',
    'flask': '🧫',
    'beaker': '🧪',
    'sparkles': '✨',
    'scale': '⚖️',
    'wind': '🌬️',
    'gauge': '📊',
    'zap': '⚡',
    'circle': '⭕',
    'leaf': '🌿',
    'flower': '🌸',
    'star': '⭐',
    'sprout': '🌱',
    'shield': '🛡️',
  };
</script>

<div class="space-y-4">
  <h2 class="font-pixel text-xs text-grow-primary">MIX</h2>

  {#if !calc.result}
    <div class="card text-center py-8">
      <p class="text-grow-muted">Erst Calc ausfuellen</p>
      <a href="/calc" class="text-grow-primary underline text-sm mt-2 inline-block">Zur Berechnung</a>
    </div>
  {:else if isDone}
    <div class="card text-center py-8">
      <p class="text-4xl mb-4">✅</p>
      <p class="font-pixel text-xs text-grow-primary mb-2">FERTIG!</p>
      <p class="text-sm text-grow-muted mb-2">Alle {total} Schritte abgeschlossen</p>
      <p class="text-sm text-green-400 font-bold mb-4">+5 Buds + 1 Log-Token verdient!</p>
      <a href="/log"
         class="block w-full py-3 rounded-xl bg-grow-primary text-grow-dark font-bold
                hover:bg-grow-accent transition-colors mb-3">
        Messwerte loggen
      </a>
      <button on:click={reset}
              class="w-full py-2 rounded-lg border border-grow-primary/30 text-grow-primary text-sm">
        Nochmal mischen
      </button>
    </div>
  {:else}
    <!-- Progress -->
    <div class="flex items-center gap-2 text-xs text-grow-muted">
      <span>Schritt {currentStep + 1} / {total}</span>
      <div class="flex-1 bg-grow-dark rounded-full h-1.5 overflow-hidden">
        <div class="h-full bg-grow-primary rounded-full transition-all"
             style="width: {((currentStep + 1) / total) * 100}%"></div>
      </div>
    </div>

    <!-- Step Cards -->
    {#each steps as step, i}
      {#if step.status === 'active'}
        <div class="card border-grow-primary/60 scale-[1.02] transition-transform">
          <div class="flex items-start gap-3">
            <span class="text-3xl">{STEP_EMOJIS[step.icon] ?? '⭕'}</span>
            <div class="flex-1">
              <p class="font-bold text-grow-text">{step.label}</p>
              <p class="text-sm text-grow-muted mt-1">{step.detail}</p>
              <p class="text-lg font-bold text-grow-accent mt-2">{step.menge}</p>
            </div>
          </div>
        </div>
      {:else if step.status === 'done'}
        <div class="card opacity-50 border-grow-primary/10">
          <div class="flex items-center gap-3">
            <span class="text-xl">✅</span>
            <span class="text-sm line-through text-grow-muted">{step.label}</span>
            <span class="ml-auto text-xs text-grow-muted">{step.menge}</span>
          </div>
        </div>
      {:else}
        <div class="card opacity-30 border-grow-primary/5">
          <div class="flex items-center gap-3">
            <span class="text-xl text-grow-muted">{STEP_EMOJIS[step.icon] ?? '⭕'}</span>
            <span class="text-sm text-grow-muted">{step.label}</span>
            <span class="ml-auto text-xs text-grow-muted">{step.menge}</span>
          </div>
        </div>
      {/if}
    {/each}

    <!-- Navigation -->
    <div class="flex gap-3 pt-2">
      <button on:click={prev} disabled={currentStep === 0}
              class="flex-1 py-3 rounded-xl border border-grow-primary/30 text-grow-primary
                     disabled:opacity-30 disabled:cursor-not-allowed">
        Zurueck
      </button>
      <button on:click={next}
              class="flex-1 py-3 rounded-xl bg-grow-primary text-grow-dark font-bold
                     hover:bg-grow-accent transition-colors">
        {currentStep === total - 1 ? 'Fertig' : 'Weiter'}
      </button>
    </div>
  {/if}
</div>
