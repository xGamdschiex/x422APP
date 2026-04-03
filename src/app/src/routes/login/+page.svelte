<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { authStore, isLoggedIn, getClientId } from '$lib/stores/auth';
  import { upsertUser } from '$lib/api/sheets';

  let error = '';
  let gsiLoaded = false;

  onMount(() => {
    if ($isLoggedIn) {
      goto('/');
      return;
    }
    loadGsi();
  });

  function loadGsi() {
    if (typeof window === 'undefined') return;
    if (document.getElementById('gsi-script')) {
      gsiLoaded = true;
      initGsi();
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      gsiLoaded = true;
      initGsi();
    };
    script.onerror = () => { error = 'Google Login konnte nicht geladen werden'; };
    document.head.appendChild(script);
  }

  function initGsi() {
    const id = getClientId();
    if (!id || !gsiLoaded || typeof google === 'undefined') return;

    google.accounts.id.initialize({
      client_id: id,
      callback: handleCredentialResponse,
      auto_select: false,
      use_fedcm_for_prompt: false,
    });

    const btnContainer = document.getElementById('g-signin-btn');
    if (btnContainer) {
      google.accounts.id.renderButton(btnContainer, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 280,
        click_listener: () => {
          // Button-Klick direkt vom User = Popup erlaubt
        },
      });
    }
  }

  async function handleCredentialResponse(response: any) {
    if (response?.credential) {
      authStore.login(response.credential);

      // Immer upsertUser aufrufen — URL ist hardcoded
      const user = get(authStore);
      if (user) {
        try {
          const result = await upsertUser({ email: user.email, name: user.name });
          if (result.ok && result.data?.role) {
            authStore.setRole(result.data.role as any);
          }
        } catch (e) {
          console.warn('[login] upsertUser fehlgeschlagen:', e);
          // offline oder API-Fehler — viewer bleibt
        }
      }

      goto('/');
    } else {
      error = 'Login fehlgeschlagen';
    }
  }
</script>

<svelte:head>
  <title>Login — x422</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-4">
  <div class="text-center space-y-2">
    <h1 class="font-pixel text-2xl text-grow-primary">x422</h1>
    <p class="text-sm text-grow-muted">feeding calculator</p>
  </div>

  <div class="card w-full max-w-sm space-y-4 flex flex-col items-center">
    <div id="g-signin-btn" class="min-h-[44px]"></div>
    {#if !gsiLoaded}
      <p class="text-xs text-grow-muted animate-pulse">Lade Google Login...</p>
    {/if}
  </div>

  {#if error}
    <p class="text-grow-danger text-xs text-center">{error}</p>
  {/if}

</div>
