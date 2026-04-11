<!--
  GrowRoom — Low-Poly Grow-Szene, passt sich dem SpaceType an
  fensterbank: Fenster + Sill | kleine_box: kleines Zelt | grosse_box: grosses Zelt + Fan | kleiner_raum: Raum + Couch + Desk
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import PixelPlant from './PixelPlant.svelte';
  import PixelZwerg from './PixelZwerg.svelte';
  import { getZwergChillAction, getZwergWorkAction } from '$lib/stores/zwerge';

  export let phase: string = 'Veg';
  export let woche: number = 1;
  export let tag: number = 1;
  /** SpaceType bestimmt die Szene */
  export let spaceType: 'fensterbank' | 'kleine_box' | 'grosse_box' | 'kleiner_raum' = 'fensterbank';
  /** Bis zu 6 ausgewaehlte Raum-Zwerge */
  export let zwerge: number[] = [];

  // Platz-Rotation
  let slots: number[] = [];
  let roamIdx: number = -1;

  $: if (zwerge.length > 0 && (slots.length !== zwerge.length || !zwerge.every((z, i) => slots.includes(z)))) {
    slots = [...zwerge];
    roamIdx = -1;
  }

  let roamTimeout: ReturnType<typeof setTimeout>;

  function scheduleRoam() {
    const delay = 8000 + Math.floor(Math.random() * 7000);
    roamTimeout = setTimeout(() => {
      if (slots.length === 0) { scheduleRoam(); return; }
      if (roamIdx >= 0) {
        roamIdx = -1;
        slots = shuffle([...slots]);
      } else {
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

  $: sitzende = slots.filter((_, i) => i !== roamIdx);
  $: vizWork = roamIdx >= 0 ? [slots[roamIdx]] : [];
  $: vizCouch = sitzende.slice(0, 3);
  $: vizDesk = sitzende.length > 3 ? sitzende[3] : null;

  $: lColor = phaseColor(phase);
  $: lOp = phaseIntensity(phase, woche);

  function phaseColor(p: string): string {
    switch (p.toLowerCase()) {
      case 'clone': case 'keimung': return '#88BBFF';
      case 'veg': return '#D4EAFF';
      case 'bloom': case 'bluete': return '#FFAA44';
      case 'flush': case 'trocknung': case 'curing': return '#FFD088';
      default: return '#D4EAFF';
    }
  }

  function phaseIntensity(p: string, w: number): number {
    switch (p.toLowerCase()) {
      case 'clone': case 'keimung': return 0.2;
      case 'veg': return 0.35 + Math.min(w * 0.05, 0.25);
      case 'bloom': case 'bluete': return 0.55 + Math.min(w * 0.03, 0.15);
      case 'flush': case 'trocknung': case 'curing': return Math.max(0.12, 0.35 - w * 0.07);
      default: return 0.35;
    }
  }

  $: isFenster = spaceType === 'fensterbank';
  $: isKleineBox = spaceType === 'kleine_box';
  $: isGrosseBox = spaceType === 'grosse_box';
  $: isRaum = spaceType === 'kleiner_raum';
  $: hasZelt = isKleineBox || isGrosseBox || isRaum;
</script>

<div class="grow-room">
  {#if isFenster}
    <!-- ===== FENSTERBANK SZENE ===== -->
    <svg class="room-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Wand -->
      <polygon points="0,0 320,0 320,200 0,200" fill="#0f1a10" />
      <polygon points="0,0 160,0 160,200 0,200" fill="#101c11" opacity="0.3" />

      <!-- Fenster-Rahmen -->
      <polygon points="40,10 280,10 280,130 40,130" fill="#3a3a3a" />
      <polygon points="44,14 276,14 276,126 44,126" fill="#1a2840" />

      <!-- Himmel durch Fenster -->
      <polygon points="44,14 276,14 276,70 44,70" fill="#1a3050" />
      <polygon points="44,70 276,70 276,126 44,126" fill="#142540" />

      <!-- Wolken -->
      <ellipse cx="100" cy="35" rx="30" ry="8" fill="#2a4060" opacity="0.3" />
      <ellipse cx="200" cy="28" rx="25" ry="6" fill="#2a4060" opacity="0.2" />

      <!-- Mond/Sterne (Nacht-Vibe) -->
      <circle cx="240" cy="30" r="6" fill="#4a6080" opacity="0.3" />

      <!-- Fenster-Kreuz -->
      <polygon points="158,14 162,14 162,126 158,126" fill="#3a3a3a" />
      <polygon points="44,68 276,68 276,72 44,72" fill="#3a3a3a" />

      <!-- Sonnenlicht-Kegel -->
      <polygon points="44,70 276,70 240,180 80,180" fill={lColor} opacity={lOp * 0.06} />

      <!-- Fensterbank -->
      <polygon points="30,128 290,128 295,140 25,140" fill="#5a4030" />
      <polygon points="30,128 160,128 160,140 25,140" fill="#664830" opacity="0.2" />
      <!-- Sill-Kante -->
      <polygon points="25,138 295,138 295,142 25,142" fill="#4a3020" />

      <!-- Boden -->
      <polygon points="0,140 320,140 320,200 0,200" fill="#0d160e" />

      <!-- CFL-Lampe (klein, an der Seite) -->
      <polygon points="258,100 266,100 267,108 257,108" fill="#333" />
      <polygon points="259,108 265,108 264,114 260,114" fill="#444" />
      <ellipse cx="262" cy="100" rx="5" ry="2" fill={lColor} opacity={lOp * 0.3} />

      <!-- Kleine Giesskanne -->
      <polygon points="60,148 74,148 72,162 62,162" fill="#2a5050" />
      <polygon points="74,148 80,144 80,148 74,150" fill="#2a5050" />
      <polygon points="60,148 67,148 67,162 62,162" fill="#356060" opacity="0.3" />
    </svg>

  {:else if isKleineBox}
    <!-- ===== KLEINE GROWBOX SZENE ===== -->
    <svg class="room-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Raum -->
      <polygon points="0,0 320,0 320,160 0,160" fill="#0a120b" />
      <polygon points="0,160 320,160 320,200 0,200" fill="#0d160e" />
      <polygon points="0,158 320,158 320,162 0,162" fill="#152015" />

      <!-- Kleines Zelt (zentriert, kompakt) -->
      <polygon points="80,30 240,30 240,158 80,158" fill="#181c20" />
      <polygon points="130,30 190,30 185,158 135,158" fill="#222830" opacity="0.2" />
      <!-- Seitenwaende -->
      <polygon points="80,30 68,24 68,164 80,158" fill="#141820" />
      <polygon points="240,30 252,24 252,164 240,158" fill="#141820" />
      <!-- Rahmen -->
      <polygon points="65,20 255,20 255,26 65,26" fill="#6a6a6a" />
      <polygon points="65,20 68,20 68,164 65,164" fill="#606060" />
      <polygon points="252,20 255,20 255,164 252,164" fill="#606060" />
      <polygon points="65,161 255,161 255,164 65,164" fill="#555" />

      <!-- LED-Lampe (kleiner) -->
      <polygon points="120,30 200,30 202,38 118,38" fill="#3a3a3a" />
      <polygon points="120,30 160,30 160,38 118,38" fill="#444" opacity="0.3" />
      <ellipse cx="160" cy="38" rx="25" ry="3" fill={lColor} opacity={lOp * 0.35} />
      {#each [130, 148, 166, 184] as lx}
        <polygon points="{lx},32 {lx+4},32 {lx+4},36 {lx},36" fill={lColor} opacity={lOp * 0.85} />
      {/each}

      <!-- Lichtkegel -->
      <polygon points="130,38 190,38 230,158 90,158" fill={lColor} opacity={lOp * 0.1} />
      <ellipse cx="160" cy="162" rx="50" ry="5" fill={lColor} opacity={lOp * 0.15} />

      <!-- Clip-Fan (klein) -->
      <circle cx="244" cy="60" r="5" fill="#3a3a3a" />
      <circle cx="244" cy="60" r="3.5" fill="#444" />
      <g class="fan-blades-small">
        <polygon points="244,55 245.5,60 244,65 242.5,60" fill="#555" />
        <polygon points="239,60 244,58.5 249,60 244,61.5" fill="#555" />
      </g>

      <!-- Regal rechts mit Duenger -->
      <polygon points="268,120 312,120 312,124 268,124" fill="#4a3020" />
      <polygon points="270,124 274,124 274,142 270,142" fill="#4a3020" />
      <polygon points="306,124 310,124 310,142 306,142" fill="#4a3020" />
      <!-- Flaschen -->
      <polygon points="274,108 282,108 281,120 275,120" fill="#2a5a3a" />
      <polygon points="288,112 294,112 293,120 289,120" fill="#5a3a2a" />
      <polygon points="300,110 306,110 305,120 301,120" fill="#3a3a5a" />
    </svg>

  {:else if isGrosseBox}
    <!-- ===== GROSSE GROWBOX SZENE ===== -->
    <svg class="room-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Raum -->
      <polygon points="0,0 320,0 320,150 0,150" fill="#0a120b" />
      <polygon points="0,0 160,0 160,150 0,150" fill="#0b130c" opacity="0.3" />
      <polygon points="0,150 320,150 320,200 0,200" fill="#0d160e" />
      <polygon points="0,148 320,148 320,152 0,152" fill="#152015" />

      <!-- Grosses Zelt -->
      <polygon points="60,18 260,18 260,148 60,148" fill="#181c20" />
      <polygon points="120,18 200,18 195,148 125,148" fill="#222830" opacity="0.2" />
      <!-- Seitenwaende -->
      <polygon points="60,18 48,12 48,154 60,148" fill="#141820" />
      <polygon points="260,18 272,12 272,154 260,148" fill="#141820" />
      <!-- Rahmen -->
      <polygon points="45,8 275,8 275,14 45,14" fill="#6a6a6a" />
      <polygon points="45,8 160,8 160,14 45,14" fill="#777" opacity="0.25" />
      <polygon points="45,8 48,8 48,154 45,154" fill="#606060" />
      <polygon points="272,8 275,8 275,154 272,154" fill="#606060" />
      <polygon points="45,151 275,151 275,154 45,154" fill="#555" />

      <!-- Quantum Board LED -->
      <polygon points="100,18 220,18 224,28 96,28" fill="#3a3a3a" />
      <polygon points="100,18 160,18 160,28 96,28" fill="#444" opacity="0.3" />
      <ellipse cx="160" cy="30" rx="35" ry="3" fill={lColor} opacity={lOp * 0.4} />
      {#each [108, 124, 140, 156, 172, 188, 204] as lx}
        <polygon points="{lx},20 {lx+4},20 {lx+4},26 {lx},26" fill={lColor} opacity={lOp * 0.9} />
      {/each}

      <!-- Lichtkegel -->
      <polygon points="110,28 210,28 260,148 60,148" fill={lColor} opacity={lOp * 0.1} />
      <polygon points="130,28 190,28 220,110 100,110" fill={lColor} opacity={lOp * 0.06} />
      <ellipse cx="160" cy="152" rx="60" ry="6" fill={lColor} opacity={lOp * 0.18} />

      <!-- Abluft-Ventilator -->
      <circle cx="266" cy="28" r="8" fill="#3a3a3a" />
      <circle cx="266" cy="28" r="6" fill="#444" />
      <g class="fan-blades-big">
        <polygon points="266,20 268,28 266,36 264,28" fill="#555" />
        <polygon points="258,28 266,26 274,28 266,30" fill="#555" />
      </g>
      <!-- Abluftrohr -->
      <polygon points="272,22 282,14 284,18 274,26" fill="#3a3a3a" />
      <polygon points="282,14 290,6 292,10 284,18" fill="#333" />

      <!-- Oszillierender Fan -->
      <polygon points="56,120 62,120 62,148 56,148" fill="#3a3a3a" />
      <circle cx="59" cy="114" r="8" fill="#3a3a3a" />
      <circle cx="59" cy="114" r="6" fill="#444" />
      <g class="fan-blades-osc">
        <polygon points="59,107 61,114 59,121 57,114" fill="#555" />
        <polygon points="52,114 59,112 66,114 59,116" fill="#555" />
      </g>

      <!-- Entfeuchter -->
      <polygon points="276,124 294,124 294,148 276,148" fill="#3a4050" />
      <polygon points="276,124 285,124 285,148 276,148" fill="#445060" opacity="0.2" />
      <line x1="279" y1="130" x2="291" y2="130" stroke="#2a3040" stroke-width="0.8" />
      <line x1="279" y1="135" x2="291" y2="135" stroke="#2a3040" stroke-width="0.8" />
      <circle cx="280" cy="126" r="1" fill="#4CAF50" opacity="0.7" />

      <!-- Messgeraet rechts -->
      <polygon points="298,80 314,80 314,100 298,100" fill="#222" />
      <polygon points="300,82 312,82 312,98 300,98" fill="#0a1a0a" class="mon-screen" />
      <polygon points="304,100 308,100 308,108 304,108" fill="#333" />
    </svg>

  {:else}
    <!-- ===== KLEINER RAUM SZENE (voll) ===== -->
    <svg class="room-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Raum -->
      <polygon points="0,0 320,0 320,132 0,132" fill="#0a120b" />
      <polygon points="0,0 160,0 160,132 0,132" fill="#0b130c" opacity="0.4" />
      <polygon points="0,132 320,132 320,200 0,200" fill="#0d160e" />
      <polygon points="100,132 220,132 220,200 100,200" fill="#0e180f" opacity="0.3" />
      <polygon points="0,130 320,130 320,134 0,134" fill="#152015" />

      <!-- Grow-Zelt -->
      <polygon points="102,22 218,22 218,132 102,132" fill="#181c20" />
      <polygon points="140,22 180,22 175,132 145,132" fill="#222830" opacity="0.25" />
      <polygon points="102,22 92,17 92,137 102,132" fill="#141820" />
      <polygon points="218,22 228,17 228,137 218,132" fill="#141820" />

      <!-- Lichtkegel -->
      <polygon points="135,30 185,30 225,132 95,132" fill={lColor} opacity={lOp * 0.12} />
      <polygon points="148,30 172,30 198,105 122,105" fill={lColor} opacity={lOp * 0.08} />
      <ellipse cx="160" cy="136" rx="55" ry="6" fill={lColor} opacity={lOp * 0.18} />

      <!-- Rahmen -->
      <polygon points="89,14 231,14 231,18 89,18" fill="#6a6a6a" />
      <polygon points="89,14 160,14 160,18 89,18" fill="#777" opacity="0.3" />
      <polygon points="89,14 92,14 92,137 89,137" fill="#606060" />
      <polygon points="228,14 231,14 231,137 228,137" fill="#606060" />
      <polygon points="89,134 231,134 231,137 89,137" fill="#555" />

      <!-- Full Spectrum Pro LED -->
      <polygon points="130,22 190,22 192,28 128,28" fill="#3a3a3a" />
      <polygon points="130,22 160,22 160,28 128,28" fill="#444" opacity="0.35" />
      <ellipse cx="160" cy="30" rx="30" ry="3" fill={lColor} opacity={lOp * 0.4} />
      {#each [136, 150, 164, 178] as lx}
        <polygon points="{lx},24 {lx+4},24 {lx+4},27 {lx},27" fill={lColor} opacity={lOp * 0.9} />
      {/each}
      <line x1="132" y1="22" x2="118" y2="16" stroke="#555" stroke-width="0.8" />
      <line x1="188" y1="22" x2="202" y2="16" stroke="#555" stroke-width="0.8" />

      <!-- Abluft -->
      <circle cx="224" cy="28" r="7" fill="#3a3a3a" />
      <circle cx="224" cy="28" r="5" fill="#444" />
      <g class="fan-blades">
        <polygon points="224,22 226,28 224,34 222,28" fill="#555" />
        <polygon points="218,28 224,26 230,28 224,30" fill="#555" />
      </g>
      <polygon points="229,22 238,16 240,20 231,26" fill="#3a3a3a" />
      <polygon points="238,16 244,10 246,14 240,20" fill="#333" />

      <!-- Entfeuchter -->
      <polygon points="220,112 236,112 236,132 220,132" fill="#3a4050" />
      <polygon points="220,112 228,112 228,132 220,132" fill="#445060" opacity="0.25" />
      <line x1="223" y1="117" x2="233" y2="117" stroke="#2a3040" stroke-width="0.8" />
      <line x1="223" y1="121" x2="233" y2="121" stroke="#2a3040" stroke-width="0.8" />
      <line x1="223" y1="125" x2="233" y2="125" stroke="#2a3040" stroke-width="0.8" />
      <circle cx="224" cy="114" r="1" fill="#4CAF50" opacity="0.7" />

      <!-- TV + Couch (links) -->
      <polygon points="14,42 80,42 81,44 13,44" fill="#222" />
      <polygon points="13,44 81,44 81,78 13,78" fill="#1a1a1a" />
      <polygon points="15,46 79,46 79,76 15,76" fill="#0a1520" class="tv-screen" />
      <polygon points="15,46 47,46 47,76 15,76" fill="#0c1825" opacity="0.4" />
      <polygon points="42,78 52,78 50,84 44,84" fill="#2a2a2a" />
      <polygon points="4,92 88,92 90,106 2,106" fill="#3a2518" />
      <polygon points="4,92 46,92 46,106 2,106" fill="#442d1c" opacity="0.25" />
      <polygon points="2,106 90,106 92,118 0,118" fill="#4a3020" />
      <polygon points="2,106 46,106 46,118 0,118" fill="#553828" opacity="0.25" />
      <polygon points="0,90 7,90 7,120 0,120" fill="#332015" />
      <polygon points="86,90 93,90 93,120 86,120" fill="#332015" />
      <polygon points="5,118 9,118 9,124 5,124" fill="#221510" />
      <polygon points="84,118 88,118 88,124 84,124" fill="#221510" />

      <!-- Desk + Monitor (rechts) -->
      <polygon points="244,118 314,118 316,122 242,122" fill="#5a4030" />
      <polygon points="244,118 278,118 278,122 242,122" fill="#664830" opacity="0.25" />
      <polygon points="246,122 250,122 250,142 246,142" fill="#4a3020" />
      <polygon points="310,122 314,122 314,142 310,142" fill="#4a3020" />
      <polygon points="249,88 273,88 274,90 248,90" fill="#222" />
      <polygon points="248,90 274,90 274,112 248,112" fill="#1a1a1a" />
      <polygon points="250,92 272,92 272,110 250,110" fill="#0a1a0a" class="mon-screen" />
      <polygon points="258,112 264,112 265,118 257,118" fill="#2a2a2a" />
      <polygon points="279,88 303,88 304,90 278,90" fill="#222" />
      <polygon points="278,90 304,90 304,112 278,112" fill="#1a1a1a" />
      <polygon points="280,92 302,92 302,110 280,110" fill="#0a1a0a" class="mon-screen" />
      <polygon points="288,112 294,112 295,118 287,118" fill="#2a2a2a" />
      <polygon points="258,119 296,119 297,121 257,121" fill="#2a2a2a" />
    </svg>
  {/if}

  <!-- Pflanze -->
  <div class="plant-pos" class:plant-fenster={isFenster} class:plant-zelt={hasZelt}>
    <PixelPlant {phase} {woche} {tag} />
  </div>

  <!-- Arbeitende Zwerge -->
  {#each vizWork.slice(0, 3) as wid, i (wid)}
    <div class="absolute zwerg-work" class:wpos-0={i===0} class:wpos-1={i===1} class:wpos-2={i===2}
         class:zwerg-fenster={isFenster}>
      <PixelZwerg id={wid} size={isFenster ? 22 : 28} action={getZwergWorkAction(wid)} />
    </div>
  {/each}

  <!-- Couch-Zwerge (nur Raum) -->
  {#if isRaum}
    {#each vizCouch as cid, i (cid)}
      <div class="absolute zwerg-couch" class:cpos-0={i===0} class:cpos-1={i===1} class:cpos-2={i===2}>
        <PixelZwerg id={cid} size={24} sitting={true} action={getZwergChillAction(cid)} />
      </div>
    {/each}
    {#if vizDesk !== null}
      <div class="absolute zwerg-desk">
        <PixelZwerg id={vizDesk} size={24} sitting={true} action="chill" />
      </div>
    {/if}
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

  /* Pflanze: Fensterbank */
  .plant-fenster {
    position: absolute;
    left: 32%;
    bottom: 30%;
    width: 36%;
    display: flex;
    justify-content: center;
  }
  /* Pflanze: Zelt */
  .plant-zelt {
    position: absolute;
    left: 36%;
    bottom: 33%;
    width: 28%;
    display: flex;
    justify-content: center;
  }
  .plant-pos :global(.lp-plant-wrap) { width: 100%; filter: none; }
  .plant-pos :global(.plant-wrap) { width: 100%; filter: none; }
  .plant-pos :global(svg) { width: 100% !important; height: auto !important; }

  /* Arbeitende Zwerge */
  .zwerg-work {
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
    animation: zw-walk 3s ease-in-out infinite;
  }
  .wpos-0 { left: 30%; bottom: 34%; }
  .wpos-1 { left: 58%; bottom: 34%; }
  .wpos-2 { left: 42%; bottom: 42%; }
  .zwerg-fenster.wpos-0 { left: 22%; bottom: 32%; }
  .zwerg-fenster.wpos-1 { left: 62%; bottom: 32%; }
  @keyframes zw-walk {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(3px); }
    75% { transform: translateX(-3px); }
  }

  /* Couch-Zwerge */
  .zwerg-couch { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
  .cpos-0 { left: 4%; bottom: 42%; }
  .cpos-1 { left: 12%; bottom: 42%; }
  .cpos-2 { left: 20%; bottom: 42%; }

  /* Desk-Zwerg */
  .zwerg-desk {
    right: 10%;
    bottom: 40%;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  }

  /* Ventilator-Animationen */
  .fan-blades { animation: fan-rotate 2s linear infinite; transform-origin: 224px 28px; }
  .fan-blades-big { animation: fan-rotate-b 2s linear infinite; transform-origin: 266px 28px; }
  .fan-blades-small { animation: fan-rotate-s 2.5s linear infinite; transform-origin: 244px 60px; }
  .fan-blades-osc { animation: fan-rotate-o 2s linear infinite; transform-origin: 59px 114px; }
  @keyframes fan-rotate { to { transform: rotate(360deg); } }
  @keyframes fan-rotate-b { to { transform: rotate(360deg); } }
  @keyframes fan-rotate-s { to { transform: rotate(360deg); } }
  @keyframes fan-rotate-o { to { transform: rotate(360deg); } }

  .tv-screen { animation: tv-flicker 5s ease-in-out infinite; }
  @keyframes tv-flicker {
    0%, 100% { opacity: 0.8; }
    48% { opacity: 0.75; }
    50% { opacity: 0.3; }
    52% { opacity: 0.8; }
    80% { opacity: 0.85; }
  }

  .mon-screen { animation: mon-pulse 3s ease-in-out infinite; }
  @keyframes mon-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.6; }
  }
</style>
