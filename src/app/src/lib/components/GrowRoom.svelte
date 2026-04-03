<!--
  GrowRoom — Low-Poly Grow-Room Szene
  Grow-Zelt (Mitte) mit Pflanze + Licht, Couch + TV (links), Desk + Monitore (rechts)
  Licht ändert Farbe/Intensität nach Phase
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import PixelPlant from './PixelPlant.svelte';
  import PixelZwerg from './PixelZwerg.svelte';
  import { getZwergChillAction, getZwergWorkAction } from '$lib/stores/zwerge';

  export let phase: string = 'Veg';
  export let woche: number = 1;
  export let tag: number = 1;
  /** Bis zu 6 ausgewaehlte Raum-Zwerge */
  export let zwerge: number[] = [];

  // Platz-Rotation: Jeder Zwerg bekommt einen Slot, der sich periodisch ändert
  // Slots: 0-2 = Couch, 3 = Desk, wenn einer "roamt" geht er zum Zelt
  let slots: number[] = []; // Kopie von zwerge, wird gemischt
  let roamIdx: number = -1; // Index in slots der gerade am Zelt arbeitet

  // Slots initialisieren wenn sich zwerge ändern
  $: if (zwerge.length > 0 && (slots.length !== zwerge.length || !zwerge.every((z, i) => slots.includes(z)))) {
    slots = [...zwerge];
    roamIdx = -1;
  }

  let roamTimeout: ReturnType<typeof setTimeout>;

  function scheduleRoam() {
    const delay = 8000 + Math.floor(Math.random() * 7000); // 8-15s
    roamTimeout = setTimeout(() => {
      if (slots.length === 0) { scheduleRoam(); return; }

      if (roamIdx >= 0) {
        // Roamer kommt zurück, Plätze mischen
        roamIdx = -1;
        slots = shuffle([...slots]);
      } else {
        // Zufällig einer geht zum Zelt
        roamIdx = Math.floor(Math.random() * slots.length);
      }
      scheduleRoam();
    }, delay);
  }

  function shuffle(arr: number[]): number[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  onMount(() => { scheduleRoam(); });
  onDestroy(() => { clearTimeout(roamTimeout); });

  // Visuelle Verteilung
  $: sitzende = slots.filter((_, i) => i !== roamIdx);
  $: vizCouch = sitzende.slice(0, 3);
  $: vizDesk = sitzende.length > 3 ? sitzende[3] : null;
  $: vizWork = roamIdx >= 0 ? [slots[roamIdx]] : [];

  $: lColor = phaseColor(phase);
  $: lOp = phaseIntensity(phase, woche);

  function phaseColor(p: string): string {
    switch (p.toLowerCase()) {
      case 'clone': return '#88BBFF';
      case 'veg': return '#D4EAFF';
      case 'bloom': return '#FFAA44';
      case 'flush': return '#FFD088';
      default: return '#D4EAFF';
    }
  }

  function phaseIntensity(p: string, w: number): number {
    switch (p.toLowerCase()) {
      case 'clone': return 0.2;
      case 'veg': return 0.35 + Math.min(w * 0.05, 0.25);
      case 'bloom': return 0.55 + Math.min(w * 0.03, 0.15);
      case 'flush': return Math.max(0.12, 0.35 - w * 0.07);
      default: return 0.35;
    }
  }
</script>

<div class="grow-room">
  <svg class="room-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">

    <!-- ===== RAUM ===== -->
    <polygon points="0,0 320,0 320,132 0,132" fill="#0a120b" />
    <polygon points="0,0 160,0 160,132 0,132" fill="#0b130c" opacity="0.4" />
    <polygon points="0,132 320,132 320,200 0,200" fill="#0d160e" />
    <polygon points="100,132 220,132 220,200 100,200" fill="#0e180f" opacity="0.3" />
    <polygon points="0,130 320,130 320,134 0,134" fill="#152015" />

    <!-- ===== GROW-ZELT (Mitte) ===== -->
    <!-- Rückwand (Mylar) -->
    <polygon points="102,22 218,22 218,132 102,132" fill="#181c20" />
    <polygon points="140,22 180,22 175,132 145,132" fill="#222830" opacity="0.25" />

    <!-- Seitenwände (Perspektive) -->
    <polygon points="102,22 92,17 92,137 102,132" fill="#141820" />
    <polygon points="218,22 228,17 228,137 218,132" fill="#141820" />

    <!-- Lichtkegel -->
    <polygon points="135,30 185,30 225,132 95,132" fill={lColor} opacity={lOp * 0.12} />
    <polygon points="148,30 172,30 198,105 122,105" fill={lColor} opacity={lOp * 0.08} />

    <!-- Boden-Glow -->
    <ellipse cx="160" cy="136" rx="55" ry="6" fill={lColor} opacity={lOp * 0.18} />

    <!-- Rahmen -->
    <polygon points="89,14 231,14 231,18 89,18" fill="#6a6a6a" />
    <polygon points="89,14 160,14 160,18 89,18" fill="#777" opacity="0.3" />
    <polygon points="89,14 92,14 92,137 89,137" fill="#606060" />
    <polygon points="228,14 231,14 231,137 228,137" fill="#606060" />
    <polygon points="89,134 231,134 231,137 89,137" fill="#555" />

    <!-- LED-Lampe -->
    <polygon points="130,22 190,22 192,28 128,28" fill="#3a3a3a" />
    <polygon points="130,22 160,22 160,28 128,28" fill="#444" opacity="0.35" />
    <!-- LED-Halo -->
    <ellipse cx="160" cy="30" rx="30" ry="3" fill={lColor} opacity={lOp * 0.4} />
    <!-- LED-Chips -->
    {#each [136, 150, 164, 178] as lx}
      <polygon points="{lx},24 {lx+4},24 {lx+4},27 {lx},27" fill={lColor} opacity={lOp * 0.9} />
    {/each}
    <!-- Kabel -->
    <line x1="132" y1="22" x2="118" y2="16" stroke="#555" stroke-width="0.8" />
    <line x1="188" y1="22" x2="202" y2="16" stroke="#555" stroke-width="0.8" />

    <!-- Abluft-Ventilator -->
    <circle cx="224" cy="28" r="7" fill="#3a3a3a" />
    <circle cx="224" cy="28" r="5" fill="#444" />
    <g class="fan-blades">
      <polygon points="224,22 226,28 224,34 222,28" fill="#555" />
      <polygon points="218,28 224,26 230,28 224,30" fill="#555" />
    </g>
    <!-- Abluftrohr -->
    <polygon points="229,22 238,16 240,20 231,26" fill="#3a3a3a" />
    <polygon points="238,16 244,10 246,14 240,20" fill="#333" />

    <!-- Entfeuchter -->
    <polygon points="220,112 236,112 236,132 220,132" fill="#3a4050" />
    <polygon points="220,112 228,112 228,132 220,132" fill="#445060" opacity="0.25" />
    <line x1="223" y1="117" x2="233" y2="117" stroke="#2a3040" stroke-width="0.8" />
    <line x1="223" y1="121" x2="233" y2="121" stroke="#2a3040" stroke-width="0.8" />
    <line x1="223" y1="125" x2="233" y2="125" stroke="#2a3040" stroke-width="0.8" />
    <circle cx="224" cy="114" r="1" fill="#4CAF50" opacity="0.7" />

    <!-- ===== TV + COUCH (links) ===== -->
    <!-- TV -->
    <polygon points="14,42 80,42 81,44 13,44" fill="#222" />
    <polygon points="13,44 81,44 81,78 13,78" fill="#1a1a1a" />
    <polygon points="15,46 79,46 79,76 15,76" fill="#0a1520" class="tv-screen" />
    <polygon points="15,46 47,46 47,76 15,76" fill="#0c1825" opacity="0.4" />
    <ellipse cx="47" cy="62" rx="32" ry="16" fill="#1a3050" opacity="0.06" />
    <polygon points="42,78 52,78 50,84 44,84" fill="#2a2a2a" />

    <!-- Couch -->
    <polygon points="4,92 88,92 90,106 2,106" fill="#3a2518" />
    <polygon points="4,92 46,92 46,106 2,106" fill="#442d1c" opacity="0.25" />
    <polygon points="2,106 90,106 92,118 0,118" fill="#4a3020" />
    <polygon points="2,106 46,106 46,118 0,118" fill="#553828" opacity="0.25" />
    <polygon points="0,90 7,90 7,120 0,120" fill="#332015" />
    <polygon points="86,90 93,90 93,120 86,120" fill="#332015" />
    <line x1="30" y1="106" x2="30" y2="116" stroke="#2a1810" stroke-width="0.8" opacity="0.5" />
    <line x1="60" y1="106" x2="60" y2="116" stroke="#2a1810" stroke-width="0.8" opacity="0.5" />
    <polygon points="5,118 9,118 9,124 5,124" fill="#221510" />
    <polygon points="84,118 88,118 88,124 84,124" fill="#221510" />

    <!-- ===== DESK + MONITORE (rechts) ===== -->
    <!-- Tisch -->
    <polygon points="244,118 314,118 316,122 242,122" fill="#5a4030" />
    <polygon points="244,118 278,118 278,122 242,122" fill="#664830" opacity="0.25" />
    <polygon points="246,122 250,122 250,142 246,142" fill="#4a3020" />
    <polygon points="310,122 314,122 314,142 310,142" fill="#4a3020" />

    <!-- Monitor 1 -->
    <polygon points="249,88 273,88 274,90 248,90" fill="#222" />
    <polygon points="248,90 274,90 274,112 248,112" fill="#1a1a1a" />
    <polygon points="250,92 272,92 272,110 250,110" fill="#0a1a0a" class="mon-screen" />
    <polygon points="250,92 261,92 261,110 250,110" fill="#0c200c" opacity="0.25" />
    <polygon points="258,112 264,112 265,118 257,118" fill="#2a2a2a" />

    <!-- Monitor 2 -->
    <polygon points="279,88 303,88 304,90 278,90" fill="#222" />
    <polygon points="278,90 304,90 304,112 278,112" fill="#1a1a1a" />
    <polygon points="280,92 302,92 302,110 280,110" fill="#0a1a0a" class="mon-screen" />
    <polygon points="280,92 291,92 291,110 280,110" fill="#0c200c" opacity="0.25" />
    <polygon points="288,112 294,112 295,118 287,118" fill="#2a2a2a" />

    <!-- Tastatur -->
    <polygon points="258,119 296,119 297,121 257,121" fill="#2a2a2a" />

    <!-- Poster (rechte Wand) -->
    <polygon points="252,48 270,48 270,68 252,68" fill="#1a2a1a" />
    <polygon points="254,50 268,50 268,66 254,66" fill="#0f200f" />
    <polygon points="261,54 258,62 261,58 264,62" fill="#3a6a3a" opacity="0.4" />

    <!-- Steckdosenleiste -->
    <polygon points="232,142 252,142 252,146 232,146" fill="#2a2a2a" />
    <circle cx="237" cy="144" r="1.5" fill="#333" />
    <circle cx="243" cy="144" r="1.5" fill="#333" />

    <!-- Monitor-Ambient -->
    <ellipse cx="276" cy="108" rx="22" ry="8" fill="#0a3a0a" opacity="0.05" />
  </svg>

  <!-- Pflanze im Zelt -->
  <div class="plant-pos">
    <PixelPlant {phase} {woche} {tag} />
  </div>

  <!-- Arbeitende Zwerge im Zelt (inkl. Roamer) -->
  {#each vizWork.slice(0, 3) as wid, i (wid)}
    <div class="absolute zwerg-work" class:wpos-0={i===0} class:wpos-1={i===1} class:wpos-2={i===2}>
      <PixelZwerg id={wid} size={28} action={getZwergWorkAction(wid)} />
    </div>
  {/each}

  <!-- Couch-Zwerge -->
  {#each vizCouch as cid, i (cid)}
    <div class="absolute zwerg-couch" class:cpos-0={i===0} class:cpos-1={i===1} class:cpos-2={i===2}>
      <PixelZwerg id={cid} size={24} sitting={true} action={getZwergChillAction(cid)} />
    </div>
  {/each}

  <!-- Desk-Zwerg -->
  {#if vizDesk !== null}
    <div class="absolute zwerg-desk">
      <PixelZwerg id={vizDesk} size={24} sitting={true} action="chill" />
    </div>
  {/if}
</div>

<style>
  .grow-room {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  .room-svg {
    display: block;
    width: 100%;
    height: auto;
    shape-rendering: geometricPrecision;
  }

  /* Pflanze im Zelt */
  .plant-pos {
    position: absolute;
    left: 36%;
    bottom: 33%;
    width: 28%;
    display: flex;
    justify-content: center;
  }
  .plant-pos :global(.lp-plant-wrap) {
    width: 100%;
    filter: none;
  }
  .plant-pos :global(svg) {
    width: 100% !important;
    height: auto !important;
  }

  /* Arbeitende Zwerge */
  .zwerg-work {
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
    animation: zw-walk 3s ease-in-out infinite;
  }
  .wpos-0 { left: 30%; bottom: 34%; }
  .wpos-1 { left: 58%; bottom: 34%; }
  .wpos-2 { left: 42%; bottom: 42%; }
  @keyframes zw-walk {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(3px); }
    75% { transform: translateX(-3px); }
  }

  /* Couch-Zwerge */
  .zwerg-couch {
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  }
  .cpos-0 { left: 4%; bottom: 42%; }
  .cpos-1 { left: 12%; bottom: 42%; }
  .cpos-2 { left: 20%; bottom: 42%; }

  /* Desk-Zwerg */
  .zwerg-desk {
    right: 10%;
    bottom: 40%;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  }

  /* Ventilator dreht */
  .fan-blades {
    animation: fan-rotate 2s linear infinite;
    transform-origin: 224px 28px;
  }
  @keyframes fan-rotate {
    to { transform: rotate(360deg); }
  }

  /* TV-Flimmern */
  .tv-screen {
    animation: tv-flicker 5s ease-in-out infinite;
  }
  @keyframes tv-flicker {
    0%, 100% { opacity: 0.8; }
    48% { opacity: 0.75; }
    50% { opacity: 0.3; }
    52% { opacity: 0.8; }
    80% { opacity: 0.85; }
  }

  /* Monitor-Glow */
  .mon-screen {
    animation: mon-pulse 3s ease-in-out infinite;
  }
  @keyframes mon-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.6; }
  }
</style>
