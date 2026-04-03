<!--
  SeedToast — Zeigt kurze Seed-Notifications an (unten, animiert).
-->
<script lang="ts">
  import { toastStore } from '$lib/stores/toast';
  import { fly, fade } from 'svelte/transition';

  $: toasts = $toastStore;
</script>

{#if toasts.length > 0}
  <div class="toast-container">
    {#each toasts as toast (toast.id)}
      <div
        class="toast-item"
        in:fly={{ y: 30, duration: 300 }}
        out:fade={{ duration: 200 }}
      >
        <span class="toast-icon">🌱</span>
        <span class="toast-text">{toast.message}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    pointer-events: none;
  }
  .toast-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 1rem;
    border-radius: 9999px;
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.4);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: toast-glow 0.6s ease-out;
  }
  .toast-icon {
    font-size: 0.9rem;
    animation: seed-bounce 0.5s ease-out;
  }
  .toast-text {
    font-size: 0.75rem;
    font-weight: 700;
    color: #7ed47e;
    white-space: nowrap;
  }
  @keyframes toast-glow {
    0% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.5); }
    100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
  }
  @keyframes seed-bounce {
    0% { transform: scale(0.5) rotate(-20deg); }
    50% { transform: scale(1.3) rotate(10deg); }
    100% { transform: scale(1) rotate(0); }
  }
</style>
