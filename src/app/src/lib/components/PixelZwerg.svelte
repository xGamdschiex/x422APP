<!--
  PixelZwerg — Low-Poly Zwerg mit Aktions-Animationen.
  Stil: Glatte Polygone statt Pixel-Raster.
  Aktionen: idle, spray, water, inspect, thumbsup, amazed, measure, harvest, dance
  Chill: roll_joint, smoke, chill (sitzende Pose)
-->
<script lang="ts">
  import { getZwerg, type Rarity } from '$lib/stores/zwerge';

  export let id: number;
  export let size: number = 24;
  export let animate: boolean = false;
  export let working: boolean = false;
  export let action: string = '';
  /** Sitzende Pose (fuer Chill-Zone) */
  export let sitting: boolean = false;

  $: def = getZwerg(id);
  $: name = def?.name ?? '???';
  $: rarity = def?.rarity ?? 'common';
  $: activeAction = action || (working ? 'water' : '');
  $: isSitting = sitting || ['roll_joint', 'smoke', 'chill'].includes(activeAction);

  const BODY_COLORS: Record<Rarity, string> = {
    common: '#8B7355', rare: '#4A90D9', epic: '#9B59B6', legendary: '#F1C40F',
  };
  const BODY_SHADOW: Record<Rarity, string> = {
    common: '#6B5535', rare: '#3A70B9', epic: '#7B3996', legendary: '#D1A40F',
  };
  const HAT_COLORS: Record<Rarity, string> = {
    common: '#D35400', rare: '#2980B9', epic: '#8E44AD', legendary: '#E67E22',
  };
  const HAT_SHADOW: Record<Rarity, string> = {
    common: '#A34000', rare: '#1960A9', epic: '#6E248D', legendary: '#C65E02',
  };
  const SKIN = '#FFDAB9';
  const SKIN_SHADOW = '#E8C9A0';
  const SKIN_DARK = '#D4B08C';

  $: hue = ((id * 37) % 360);
  $: pantsColor = `hsl(${hue}, 40%, 35%)`;
  $: pantsShadow = `hsl(${hue}, 40%, 25%)`;
  $: beardColor = rarity === 'legendary' ? '#F1C40F' : `hsl(${(hue + 180) % 360}, 20%, 60%)`;
  $: beardShadow = rarity === 'legendary' ? '#C8A00C' : `hsl(${(hue + 180) % 360}, 20%, 45%)`;
  $: hatColor = HAT_COLORS[rarity];
  $: hatShadow = HAT_SHADOW[rarity];
  $: bodyColor = BODY_COLORS[rarity];
  $: bodyShadow = BODY_SHADOW[rarity];

  const BOOT = '#4A3728';
  const BOOT_LIGHT = '#5E4938';
  const BELT = '#333';

  $: animClass = activeAction
    ? `animate-${activeAction}`
    : animate ? 'animate-bob' : '';

  // Accessoire-Typ ableiten
  $: accessoryType = (() => {
    if (!def) return 'none';
    if (def.grow_role) {
      const m: Record<string, string> = {
        vpd_manager: 'thermometer', nutrient_manager: 'flask', light_manager: 'bulb',
        quality_manager: 'magnifier', pest_controller: 'shield', general: 'trowel'
      };
      return m[def.grow_role] || 'none';
    }
    const t: Record<string, string> = {
      log_save: 'notebook', has_notiz: 'notebook',
      mix_complete: 'flask', has_ph: 'flask', has_ec: 'flask',
      medium_coco: 'flask', medium_hydro: 'flask', medium_erde: 'flask',
      has_ro: 'flask', feedline_change: 'flask',
      bloom_phase: 'flower', veg_phase: 'leaf', flush_phase: 'leaf',
      grow_complete: 'trophy', new_strain: 'seedbag', bloom_w5plus: 'crystal',
      phase_change: 'hourglass',
      daily_login: 'sun', streak_7: 'calendar', night_login: 'moon',
      offline_sync: 'cloud',
      extraction_run: 'press',
      passive: 'star', pack_open: 'gift',
    };
    return t[def.buff_trigger] || 'none';
  })();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 48 48"
  class="lp-zwerg {animClass}"
  role="img"
  aria-label={name}
>
  {#if isSitting}
    <!-- ===== SITZENDE POSE ===== -->
    <g class="zwerg-body-sitting">
      <!-- Hut (Kegel-Form) -->
      <polygon points="24,1 18,10 30,10" fill={hatColor} />
      <polygon points="24,1 24,10 18,10" fill={hatShadow} />
      <!-- Hutkrempe -->
      <polygon points="16,10 32,10 30,12 18,12" fill={hatColor} />
      <polygon points="16,10 24,10 24,12 18,12" fill={hatShadow} opacity="0.3" />

      <!-- Hut-Deko nach Rarity (sitzend) -->
      {#if rarity === 'rare'}
        <polygon points="28,4 30,1 29,7" fill="#e74c3c" opacity="0.8" />
      {:else if rarity === 'epic'}
        <rect x="19" y="8" width="10" height="1.5" fill="#2c3e50" opacity="0.5" />
        <polygon points="23,7 25,7 25.5,9 24,10 22.5,9" fill="#e74c3c" />
      {:else if rarity === 'legendary'}
        <polygon points="20,4 22,1 24,3 26,1 28,4" fill="#F1C40F" />
        <circle cx="22" cy="3.5" r="0.8" fill="#e74c3c" />
        <circle cx="24" cy="2.5" r="0.8" fill="#2980B9" />
        <circle cx="26" cy="3.5" r="0.8" fill="#27ae60" />
      {/if}

      <!-- Kopf -->
      <polygon points="18,12 30,12 31,16 29,20 19,20 17,16" fill={SKIN} />
      <polygon points="18,12 24,12 24,20 19,20 17,16" fill={SKIN_SHADOW} opacity="0.3" />

      <!-- Augen -->
      {#if activeAction === 'smoke'}
        <line x1="20" y1="15" x2="22" y2="15" stroke="#222" stroke-width="1.5" stroke-linecap="round" />
        <line x1="26" y1="15" x2="28" y2="15" stroke="#222" stroke-width="1.5" stroke-linecap="round" />
      {:else}
        <circle cx="21" cy="15" r="1.2" fill="#222" />
        <circle cx="27" cy="15" r="1.2" fill="#222" />
        <circle cx="21.5" cy="14.5" r="0.4" fill="#fff" />
        <circle cx="27.5" cy="14.5" r="0.4" fill="#fff" />
      {/if}

      <!-- Laecheln -->
      {#if activeAction === 'smoke' || activeAction === 'chill'}
        <path d="M22,17 Q24,19 26,17" stroke="#c0392b" stroke-width="0.8" fill="none" opacity="0.6" />
      {/if}

      <!-- Bart -->
      <polygon points="17,18 31,18 29,24 24,26 19,24" fill={beardColor} />
      <polygon points="17,18 24,18 24,26 19,24" fill={beardShadow} opacity="0.3" />

      <!-- Koerper (sitzend — kuerzerer Torso) -->
      <polygon points="17,24 31,24 32,32 16,32" fill={bodyColor} />
      <polygon points="17,24 24,24 24,32 16,32" fill={bodyShadow} opacity="0.3" />
      <!-- Guertel -->
      <polygon points="16,31 32,31 32,33 16,33" fill={BELT} />
      <polygon points="22,31 26,31 26,33 22,33" fill={hatColor} />

      <!-- Beine (angewinkelt) -->
      <polygon points="14,33 22,33 20,37 12,37" fill={pantsColor} />
      <polygon points="26,33 34,33 36,37 28,37" fill={pantsColor} />
      <polygon points="14,33 18,33 18,37 12,37" fill={pantsShadow} opacity="0.3" />

      <!-- Stiefel -->
      <polygon points="10,37 20,37 20,41 8,41 9,39" fill={BOOT} />
      <polygon points="28,37 38,37 39,39 40,41 28,41" fill={BOOT} />
      <polygon points="10,37 14,37 14,41 8,41" fill={BOOT_LIGHT} opacity="0.3" />
    </g>

    <!-- ===== CHILL-AKTIONEN ===== -->
    {#if activeAction === 'roll_joint'}
      <!-- Haende vor dem Koerper -->
      <polygon points="20,27 22,26 24,27 22,28" fill={SKIN} />
      <polygon points="24,27 26,26 28,27 26,28" fill={SKIN_SHADOW} />
      <!-- Joint-Paper -->
      <g class="rolling-hands">
        <polygon points="20,25 28,25 27,26 21,26" fill="#f5f0d0" />
        <circle cx="23" cy="24" r="0.8" fill="#4a7a3a" opacity="0.8" />
        <circle cx="25" cy="24" r="0.6" fill="#5ab05a" opacity="0.6" />
      </g>

    {:else if activeAction === 'smoke'}
      <!-- Linke Hand haelt Joint -->
      <polygon points="10,24 14,23 15,26 11,26" fill={SKIN} />
      <!-- Joint -->
      <polygon points="5,18 12,20 11,21 4,19" fill="#f5f0d0" />
      <circle cx="4" cy="18" r="1.2" fill="#e74c3c" opacity="0.9" />
      <!-- Rauch -->
      <g class="smoke-particles">
        <circle cx="3" cy="14" r="1.5" fill="#ccc" opacity="0.4" />
        <circle cx="5" cy="10" r="2" fill="#ddd" opacity="0.25" />
        <circle cx="2" cy="6" r="2.5" fill="#eee" opacity="0.15" />
      </g>
      <!-- Rechter Arm relaxed -->
      <polygon points="32,27 36,26 37,28 33,28" fill={SKIN} />

    {:else}
      <!-- chill: Arme seitlich -->
      <polygon points="12,27 16,26 17,28 13,28" fill={SKIN} />
      <polygon points="32,27 36,26 37,28 33,28" fill={SKIN} />
    {/if}

  {:else}
    <!-- ===== STEHENDE POSE ===== -->
    <g class="zwerg-body">
      <!-- Hut (Kegel) -->
      <polygon points="24,1 17,10 31,10" fill={hatColor} />
      <polygon points="24,1 24,10 17,10" fill={hatShadow} opacity="0.3" />
      <!-- Hutkrempe -->
      <polygon points="15,10 33,10 31,12 17,12" fill={hatColor} />
      <!-- Highlight -->
      <polygon points="24,3 22,8 26,8" fill="#fff" opacity="0.1" />

      <!-- Hut-Deko nach Rarity -->
      {#if rarity === 'rare'}
        <polygon points="29,4 31,1 30,7" fill="#e74c3c" opacity="0.8" />
      {:else if rarity === 'epic'}
        <rect x="18" y="8" width="12" height="1.5" fill="#2c3e50" opacity="0.5" />
        <polygon points="23,7 25,7 25.5,9 24,10 22.5,9" fill="#e74c3c" />
      {:else if rarity === 'legendary'}
        <polygon points="20,4 22,1 24,3 26,1 28,4" fill="#F1C40F" />
        <circle cx="22" cy="3.5" r="0.8" fill="#e74c3c" />
        <circle cx="24" cy="2.5" r="0.8" fill="#2980B9" />
        <circle cx="26" cy="3.5" r="0.8" fill="#27ae60" />
      {/if}

      <!-- Kopf -->
      <polygon points="17,12 31,12 32,16 30,20 18,20 16,16" fill={SKIN} />
      <polygon points="17,12 24,12 24,20 18,20 16,16" fill={SKIN_SHADOW} opacity="0.25" />

      <!-- Augen -->
      {#if activeAction === 'amazed'}
        <circle cx="21" cy="15" r="2" fill="#222" />
        <circle cx="27" cy="15" r="2" fill="#222" />
        <circle cx="21.8" cy="14.2" r="0.7" fill="#fff" />
        <circle cx="27.8" cy="14.2" r="0.7" fill="#fff" />
      {:else if activeAction === 'inspect'}
        <ellipse cx="21" cy="15" rx="1.2" ry="0.8" fill="#222" />
        <ellipse cx="27" cy="16" rx="1.2" ry="0.8" fill="#222" />
      {:else}
        <circle cx="21" cy="15" r="1.2" fill="#222" />
        <circle cx="27" cy="15" r="1.2" fill="#222" />
        <circle cx="21.5" cy="14.5" r="0.4" fill="#fff" />
        <circle cx="27.5" cy="14.5" r="0.4" fill="#fff" />
      {/if}

      <!-- Mund -->
      {#if activeAction === 'amazed'}
        <ellipse cx="24" cy="18" rx="1.5" ry="1" fill="#c0392b" />
      {:else if activeAction === 'thumbsup' || activeAction === 'dance'}
        <path d="M21,17.5 Q24,20 27,17.5" stroke="#c0392b" stroke-width="0.8" fill="none" />
      {/if}

      <!-- Bart -->
      <polygon points="16,18 32,18 30,26 24,28 18,26" fill={beardColor} />
      <polygon points="16,18 24,18 24,28 18,26" fill={beardShadow} opacity="0.25" />
      <!-- Bart-Highlights -->
      <polygon points="18,20 20,20 19,22" fill="#fff" opacity="0.06" />

      <!-- Torso -->
      <polygon points="16,26 32,26 33,36 15,36" fill={bodyColor} />
      <polygon points="16,26 24,26 24,36 15,36" fill={bodyShadow} opacity="0.25" />
      <!-- Schatten unten -->
      <polygon points="15,34 33,34 33,36 15,36" fill="#000" opacity="0.08" />
      <!-- Guertel -->
      <polygon points="15,35 33,35 33,37 15,37" fill={BELT} />
      <polygon points="22,35 26,35 26,37 22,37" fill={hatColor} />

      <!-- Hose -->
      <polygon points="16,37 24,37 23,42 15,42" fill={pantsColor} />
      <polygon points="24,37 32,37 33,42 25,42" fill={pantsColor} />
      <polygon points="16,37 20,37 19,42 15,42" fill={pantsShadow} opacity="0.25" />

      <!-- Stiefel -->
      <polygon points="14,42 24,42 24,46 12,46 13,44" fill={BOOT} />
      <polygon points="24,42 34,42 35,44 36,46 24,46" fill={BOOT} />
      <polygon points="14,42 18,42 18,46 12,46" fill={BOOT_LIGHT} opacity="0.25" />
      <polygon points="24,42 28,42 28,46 24,46" fill={BOOT_LIGHT} opacity="0.25" />
    </g>

    <!-- ===== ARME + WERKZEUGE ===== -->
    {#if activeAction === 'spray'}
      <g class="arm-left arm-spray">
        <!-- Arm -->
        <polygon points="10,24 14,23 16,27 12,27" fill={SKIN} />
        <polygon points="8,22 12,21 14,24 10,24" fill={SKIN_SHADOW} />
        <!-- Spruehflasche -->
        <polygon points="4,18 10,18 10,24 4,24" fill="#5bc0de" rx="1" />
        <polygon points="4,18 7,18 7,24 4,24" fill="#3aa5c4" />
        <polygon points="6,16 8,16 8,18 6,18" fill="#5bc0de" />
        <circle cx="3" cy="22" r="1.5" fill="#e74c3c" />
      </g>
      <g class="spray-drops">
        <circle cx="3" cy="15" r="1" fill="#85d4f0" opacity="0.7" />
        <circle cx="1" cy="12" r="0.8" fill="#85d4f0" opacity="0.5" />
        <circle cx="5" cy="10" r="0.6" fill="#85d4f0" opacity="0.4" />
      </g>
      <polygon points="34,26 38,25 39,28 35,28" fill={SKIN} />

    {:else if activeAction === 'water'}
      <g class="arm-right arm-water">
        <!-- Arm -->
        <polygon points="34,26 38,25 40,28 36,28" fill={SKIN} />
        <polygon points="38,22 42,21 44,24 40,24" fill={SKIN_SHADOW} />
        <!-- Giesskanne -->
        <polygon points="38,18 46,18 46,24 38,24" fill="#27ae60" />
        <polygon points="38,18 42,18 42,24 38,24" fill="#2ecc71" opacity="0.5" />
        <polygon points="44,16 46,16 48,18 44,18" fill="#27ae60" />
      </g>
      <g class="water-stream">
        <circle cx="47" cy="19" r="0.8" fill="#4a90d9" opacity="0.8" />
        <circle cx="46" cy="22" r="0.7" fill="#4a90d9" opacity="0.6" />
        <circle cx="45" cy="25" r="0.6" fill="#4a90d9" opacity="0.4" />
      </g>
      <polygon points="10,26 14,25 15,28 11,28" fill={SKIN} />

    {:else if activeAction === 'inspect'}
      <g class="arm-right arm-inspect">
        <polygon points="34,26 38,24 39,27 35,28" fill={SKIN} />
        <polygon points="37,22 40,20 41,23 38,24" fill={SKIN_SHADOW} />
        <!-- Lupe -->
        <circle cx="42" cy="14" r="4" fill="none" stroke="#8B7355" stroke-width="1.5" />
        <circle cx="42" cy="14" r="3.5" fill="#b8e6ff" opacity="0.25" />
        <line x1="39" y1="17" x2="37" y2="22" stroke="#8B7355" stroke-width="1.5" />
        <circle cx="43" cy="12.5" r="1" fill="#fff" opacity="0.4" />
      </g>
      <polygon points="10,26 14,25 15,28 11,28" fill={SKIN} />

    {:else if activeAction === 'thumbsup'}
      <g class="arm-right arm-thumbsup">
        <polygon points="34,26 38,24 39,27 35,28" fill={SKIN} />
        <polygon points="37,20 40,18 41,22 38,23" fill={SKIN} />
        <!-- Daumen -->
        <polygon points="36,12 38,10 40,12 40,18 36,18" fill={SKIN} />
        <polygon points="36,12 37,10 38,14 36,14" fill={SKIN_SHADOW} opacity="0.3" />
      </g>
      <polygon points="10,26 14,25 15,28 11,28" fill={SKIN} />

    {:else if activeAction === 'amazed'}
      <g class="arms-amazed">
        <!-- Arme hoch -->
        <polygon points="10,24 14,22 16,26 12,27" fill={SKIN} />
        <polygon points="8,18 12,16 14,22 10,22" fill={SKIN} />
        <polygon points="34,24 38,22 40,26 36,27" fill={SKIN} />
        <polygon points="36,18 40,16 42,22 38,22" fill={SKIN} />
      </g>
      <g class="exclaim">
        <polygon points="42,6 44,6 44,12 42,12" fill="#e74c3c" />
        <circle cx="43" cy="14" r="1" fill="#e74c3c" />
      </g>

    {:else if activeAction === 'measure'}
      <g class="arm-left arm-measure">
        <polygon points="10,24 14,23 16,27 12,27" fill={SKIN} />
        <polygon points="8,22 12,21 14,24 10,24" fill={SKIN_SHADOW} />
        <!-- Messgeraet -->
        <polygon points="4,16 10,16 10,26 4,26" fill="#34495e" rx="1" />
        <polygon points="5,18 9,18 9,22 5,22" fill="#2ecc71" />
        <polygon points="6,18 8,18 8,20 6,20" fill="#7ed47e" />
        <polygon points="6,26 8,26 7,32" fill="#7f8c8d" />
      </g>
      <polygon points="34,26 38,25 39,28 35,28" fill={SKIN} />

    {:else if activeAction === 'harvest'}
      <g class="arm-right arm-harvest">
        <polygon points="34,26 38,24 39,27 35,28" fill={SKIN} />
        <polygon points="37,22 40,20 41,24 38,24" fill={SKIN_SHADOW} />
        <!-- Schere -->
        <polygon points="40,16 42,16 42,22 40,22" fill="#bdc3c7" />
        <polygon points="42,16 44,16 44,22 42,22" fill="#95a5a6" />
        <polygon points="38,14 44,14 44,16 38,16" fill="#95a5a6" />
        <circle cx="41" cy="23" r="1" fill="#e74c3c" />
      </g>
      <g class="harvest-leaf">
        <polygon points="42,8 44,6 46,8 44,12" fill="#7ed47e" />
      </g>
      <polygon points="10,26 14,25 15,28 11,28" fill={SKIN} />

    {:else if activeAction === 'dance'}
      <g class="arms-dance">
        <!-- Links hoch -->
        <polygon points="10,24 14,22 16,26 12,27" fill={SKIN} />
        <polygon points="8,16 12,14 14,22 10,22" fill={SKIN} />
        <!-- Rechts runter -->
        <polygon points="34,26 38,25 39,28 35,28" fill={SKIN} />
        <polygon points="38,22 42,20 43,24 39,24" fill={SKIN} />
      </g>
      <g class="dance-notes">
        <polygon points="6,8 8,6 10,8 8,10" fill="#f39c12" />
        <polygon points="40,10 42,8 44,10 42,12" fill="#f39c12" />
      </g>

    {:else}
      <!-- Idle Arme -->
      <polygon points="10,26 14,25 15,28 11,28" fill={SKIN} />
      <polygon points="34,26 38,25 39,28 35,28" fill={SKIN} />
      <!-- Idle Accessoire (Gemini PNG) -->
      {#if accessoryType !== 'none'}
        <image href="/icons/{accessoryType}.png" x="34" y="18" width="12" height="12" />
      {/if}
    {/if}
  {/if}

  <!-- Rarity Glow -->
  {#if rarity === 'legendary'}
    <polygon points="14,8 34,8 36,38 12,38" fill="#F1C40F" opacity="0.06" />
  {/if}
</svg>

<style>
  .lp-zwerg {
    /* Low-Poly: smooth rendering */
    shape-rendering: geometricPrecision;
  }

  /* === IDLE === */
  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .animate-bob { animation: bob 2s ease-in-out infinite; }

  /* === SPRAY === */
  @keyframes spray-body {
    0%, 100% { transform: translateX(0); }
    30% { transform: translateX(-1px); }
  }
  @keyframes spray-drops {
    0% { opacity: 0; transform: translate(0, 0); }
    30% { opacity: 1; transform: translate(-1px, -1px); }
    70% { opacity: 0.6; transform: translate(-2px, -2px); }
    100% { opacity: 0; transform: translate(-3px, -1px); }
  }
  .animate-spray { animation: spray-body 1.2s ease-in-out infinite; }
  .animate-spray .spray-drops { animation: spray-drops 1.2s ease-out infinite; }

  /* === WATER === */
  @keyframes water-pour {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(4deg); }
    50% { transform: rotate(6deg); }
    80% { transform: rotate(2deg); }
  }
  @keyframes water-drip {
    0%, 20% { opacity: 0; }
    40% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(4px); }
  }
  .animate-water { animation: water-pour 2s ease-in-out infinite; transform-origin: center bottom; }
  .animate-water .water-stream { animation: water-drip 1.5s ease-in infinite; }

  /* === INSPECT === */
  @keyframes inspect-lean {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(2px); }
  }
  .animate-inspect { animation: inspect-lean 2.5s ease-in-out infinite; }

  /* === THUMBSUP === */
  @keyframes thumbs-pulse {
    0%, 100% { transform: translateY(0); }
    30% { transform: translateY(-2px); }
  }
  .animate-thumbsup { animation: thumbs-pulse 1.5s ease-in-out infinite; }

  /* === AMAZED === */
  @keyframes amazed-jump {
    0%, 100% { transform: translateY(0); }
    15% { transform: translateY(-3px); }
    30% { transform: translateY(0); }
    45% { transform: translateY(-2px); }
    60% { transform: translateY(0); }
  }
  @keyframes exclaim-flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .animate-amazed { animation: amazed-jump 2s ease-in-out infinite; }
  .animate-amazed .exclaim { animation: exclaim-flash 0.8s ease-in-out infinite; }

  /* === MEASURE === */
  @keyframes measure-dip {
    0%, 100% { transform: translateY(0); }
    30% { transform: translateY(2px); }
  }
  .animate-measure { animation: measure-dip 2s ease-in-out infinite; }

  /* === HARVEST === */
  @keyframes harvest-snip {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    50% { transform: rotate(3deg); }
  }
  @keyframes leaf-fall {
    0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
    50% { opacity: 0.7; transform: translate(1px, 3px) rotate(20deg); }
    100% { opacity: 0; transform: translate(2px, 6px) rotate(45deg); }
  }
  .animate-harvest { animation: harvest-snip 1s ease-in-out infinite; }
  .animate-harvest .harvest-leaf { animation: leaf-fall 2s ease-in infinite; }

  /* === DANCE === */
  @keyframes dance-groove {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    15% { transform: translateY(-2px) rotate(-3deg); }
    30% { transform: translateY(0) rotate(0deg); }
    45% { transform: translateY(-2px) rotate(3deg); }
    60% { transform: translateY(0) rotate(0deg); }
  }
  @keyframes notes-float {
    0% { opacity: 0; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-2px); }
    100% { opacity: 0; transform: translateY(-6px); }
  }
  .animate-dance { animation: dance-groove 1.2s ease-in-out infinite; transform-origin: center bottom; }
  .animate-dance .dance-notes { animation: notes-float 1.5s ease-out infinite; }

  /* === ROLL JOINT === */
  @keyframes roll-hands {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(3deg); }
    75% { transform: rotate(-3deg); }
  }
  .animate-roll_joint { animation: bob 3s ease-in-out infinite; }
  .animate-roll_joint .rolling-hands { animation: roll-hands 0.8s ease-in-out infinite; }

  /* === SMOKE === */
  @keyframes smoke-rise {
    0% { opacity: 0.5; transform: translateY(0); }
    50% { opacity: 0.2; transform: translateY(-4px) translateX(1px); }
    100% { opacity: 0; transform: translateY(-8px) translateX(2px); }
  }
  @keyframes smoke-breathe {
    0%, 100% { transform: translateY(0); }
    40% { transform: translateY(-1px); }
  }
  .animate-smoke { animation: smoke-breathe 3s ease-in-out infinite; }
  .animate-smoke .smoke-particles { animation: smoke-rise 2.5s ease-out infinite; }

  /* === CHILL === */
  @keyframes chill-sway {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(1deg); }
  }
  .animate-chill { animation: chill-sway 4s ease-in-out infinite; transform-origin: center bottom; }
</style>
