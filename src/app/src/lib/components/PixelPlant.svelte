<script lang="ts">
  export let phase: string = 'Veg';
  export let woche: number = 1;
  export let tag: number = 1;

  const C = {
    forestDeep:  '#0f2d0f',
    canopy:      '#2d6b2d',
    leafMid:     '#3d8c3d',
    leafLight:   '#5ab05a',
    freshLime:   '#7ed47e',
    leafEdge:    '#2a5e2a',
    barkDark:    '#3b2a1a',
    barkMid:     '#5a3d25',
    barkLight:   '#6b4c2a',
    terracotta:  '#8b5e3c',
    terracottaLt:'#a0704d',
    terracottaDk:'#6b4020',
    soil:        '#3d2b1a',
    soilLight:   '#4d3822',
    budGreen:    '#4a7a3a',
    budLight:    '#6b9b5b',
    budDense:    '#3a6a2a',
    calyxLight:  '#5d944d',
    pistilWhite: '#f5efe5',
    pistilOrange:'#e8873a',
    pistilRed:   '#cc5533',
    trichClear:  '#f0ead0',
    trichMilky:  '#f5f0d0',
    trichAmber:  '#d4a020',
    fadeYellow:  '#c8b040',
    fadeBrown:   '#8b7240',
    fadeOlive:   '#8a9a40',
    waterBlue:   '#4a90d9',
    bloomRed:    '#d94a4a',
    amberGold:   '#d4a017',
    white:       '#ffffff',
  };

  $: growProgress = getGrowProgress(phase, woche, tag);

  function getGrowProgress(p: string, w: number, t: number): number {
    let totalDay = 0;
    const pl = p.toLowerCase();
    if (pl === 'veg' || pl === 'bloom' || pl === 'flush') totalDay += 14;
    if (pl === 'bloom' || pl === 'flush') totalDay += 28;
    if (pl === 'flush') totalDay += 56;
    totalDay += (w - 1) * 7 + t;
    return Math.min(totalDay / 105, 1);
  }

  $: stemH = 12 + Math.round(growProgress * 45);
  $: stemBase = 82;
  $: stemTop = stemBase - stemH;
  $: nodeCount = Math.min(2 + Math.floor(growProgress * 6), 7);
  $: isBloom = phase.toLowerCase() === 'bloom';
  $: isFlush = phase.toLowerCase() === 'flush';
  $: isFading = (isBloom && woche >= 7) || isFlush;
  $: hasBuds = isBloom && woche >= 2;
  $: hasThickBuds = isBloom && woche >= 4;
  $: hasTrichomes = isBloom && woche >= 5;

  // Node-Positionen
  $: nodes = Array.from({ length: nodeCount }, (_, i) => {
    const spacing = stemH / (nodeCount + 1);
    const y = stemTop + spacing * (i + 1);
    const age = 1 - (i / nodeCount);
    const leafLen = Math.round(10 + age * 12 + growProgress * 8);
    const fingers = leafLen > 18 ? 7 : leafLen > 12 ? 5 : 3;
    return { y, leafLen, fingers, side: i % 2 === 0 ? -1 : 1 };
  });

  function leafColor(index: number): string {
    if (isFading) return index < nodeCount / 2 ? C.fadeBrown : C.fadeYellow;
    if (isBloom) return index < 2 ? C.leafMid : C.canopy;
    return index < 2 ? C.freshLime : C.leafLight;
  }

  function leafColorDark(index: number): string {
    if (isFading) return C.fadeOlive;
    if (isBloom) return C.canopy;
    return C.leafMid;
  }

  // Low-Poly Cannabis-Blatt — Polygone statt Linien
  function cannabisLeaf(cx: number, cy: number, dir: number, len: number, fc: number, color: string, colorDark: string): string {
    const paths: string[] = [];

    // Blattstiel
    const petioleLen = Math.round(len * 0.35);
    const px = cx + dir * petioleLen;
    const pw = 1.2;
    paths.push(`<polygon points="${cx},${cy - pw/2} ${px},${cy - pw} ${px},${cy + pw} ${cx},${cy + pw/2}" fill="${colorDark}" />`);

    // Finger-Definitionen
    const fingerDefs: [number, number][] = [];

    if (fc >= 7) {
      fingerDefs.push(
        [-90, 1.0], [-70, 0.85], [-110, 0.85],
        [-50, 0.65], [-130, 0.65], [-35, 0.4], [-145, 0.4],
      );
    } else if (fc >= 5) {
      fingerDefs.push(
        [-90, 1.0], [-65, 0.8], [-115, 0.8],
        [-40, 0.5], [-140, 0.5],
      );
    } else {
      fingerDefs.push(
        [-90, 1.0], [-55, 0.65], [-125, 0.65],
      );
    }

    const baseAngle = dir < 0 ? 20 : -20;

    fingerDefs.forEach(([angle, factor], fi) => {
      const fLen = Math.round(len * 0.6 * factor);
      const rad = ((angle + baseAngle) * Math.PI) / 180;
      const ex = px + Math.cos(rad) * fLen;
      const ey = cy + Math.sin(rad) * fLen;

      // Fingerbreite (verjuengt sich zur Spitze)
      const bw = Math.max(1.2, fLen * 0.15);
      // Senkrechte fuer Breite
      const perpX = -(ey - cy) / fLen * bw;
      const perpY = (ex - px) / fLen * bw;

      // Low-Poly Finger als Dreieck (breit an der Basis, spitz an der Spitze)
      paths.push(`<polygon points="${px + perpX},${cy + perpY} ${px - perpX},${cy - perpY} ${ex},${ey}" fill="${color}" />`);

      // Serrations als kleine Dreiecke am Rand
      if (fLen > 6) {
        const steps = Math.floor(fLen / 5);
        for (let s = 1; s <= steps; s++) {
          const t = s / (steps + 1);
          const sx = px + (ex - px) * t;
          const sy = cy + (ey - cy) * t;
          const sw = bw * (1 - t) * 0.8;
          const spx = perpX / bw * sw * 1.5;
          const spy = perpY / bw * sw * 1.5;
          // Zacke nur auf einer Seite (alternierend)
          if (s % 2 === 0) {
            paths.push(`<polygon points="${sx + spx},${sy + spy} ${sx + spx * 2},${sy + spy * 2} ${sx + (ex - px) / fLen * 2},${sy + (ey - cy) / fLen * 2}" fill="${color}" opacity="0.7" />`);
          }
        }
      }

      // Mittelrippe als duenne Linie (dunklere Farbe)
      if (fi === 0 || fLen > 8) {
        paths.push(`<line x1="${px}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${colorDark}" stroke-width="0.5" opacity="0.4" />`);
      }
    });

    return paths.join('\n');
  }
</script>

<div class="lp-plant-wrap flex justify-center">
  <svg viewBox="0 0 96 96" width="210" height="210" xmlns="http://www.w3.org/2000/svg">

    <!-- ===== TOPF (Low-Poly) ===== -->
    <!-- Schatten -->
    <ellipse cx="48" cy="94" rx="14" ry="2" fill="#0a150a" opacity="0.3" />
    <!-- Topf-Koerper: Trapez statt Rechteck -->
    <polygon points="34,83 36,93 60,93 62,83" fill={C.terracotta} />
    <polygon points="34,83 48,83 48,93 36,93" fill={C.terracottaDk} opacity="0.3" />
    <!-- Topfrand -->
    <polygon points="32,81 64,81 62,84 34,84" fill={C.terracottaLt} />
    <polygon points="32,81 48,81 48,84 34,84" fill={C.terracotta} opacity="0.3" />
    <!-- Erde -->
    <polygon points="34,83 62,83 60,86 36,86" fill={C.soil} />
    <polygon points="38,83 46,83 44,85 39,85" fill={C.soilLight} opacity="0.35" />

    <!-- ===== STAMM (Low-Poly) ===== -->
    <polygon points="47,{stemTop} 50,{stemTop} 50.5,{stemBase} 46.5,{stemBase}"
             fill={isFading ? C.barkMid : C.canopy} />
    <!-- Stamm-Highlight -->
    <polygon points="47,{stemTop} 48.5,{stemTop} 48.5,{stemBase} 46.5,{stemBase}"
             fill={isFading ? C.barkLight : C.leafMid} opacity="0.3" />

    <!-- ===== CANNABIS-BLAETTER ===== -->
    {#each nodes as node, i}
      {@const color = leafColor(i)}
      {@const colorDk = leafColorDark(i)}
      {@html cannabisLeaf(48, node.y, node.side, node.leafLen, node.fingers, color, colorDk)}
    {/each}

    <!-- ===== APEX / BUDS ===== -->
    {#if !hasBuds}
      <!-- Veg: Neuer Trieb oben -->
      <g class="apex-grow">
        {@html cannabisLeaf(48, stemTop + 3, -1, 8, 3, C.freshLime, C.leafLight)}
        {@html cannabisLeaf(48, stemTop + 3, 1, 8, 3, C.freshLime, C.leafLight)}
        <!-- Apex-Knospe als Polygon-Cluster -->
        <polygon points="46,{stemTop - 2} 48,{stemTop - 5} 50,{stemTop - 2}" fill={C.freshLime} />
        <polygon points="47,{stemTop - 1} 48,{stemTop - 4} 49,{stemTop - 1}" fill={C.leafLight} opacity="0.5" />
      </g>
    {:else}
      <!-- ===== MAIN COLA ===== -->
      {@const colaH = Math.min(8 + woche * 2, 24)}
      {@const colaW = Math.min(7 + woche, 14)}
      {@const colaY = stemTop - colaH + 2}

      <!-- Cola: konische Low-Poly Form mit Facetten -->
      <polygon points="{48 - colaW/2 + 3},{stemTop + 1} {48 - colaW/2},{colaY + colaH * 0.4} {48 - 2},{colaY} {48 + 2},{colaY} {48 + colaW/2},{colaY + colaH * 0.4} {48 + colaW/2 - 3},{stemTop + 1}"
              fill={C.budGreen} />
      <!-- Schatten-Haelfte -->
      <polygon points="{48 - colaW/2 + 3},{stemTop + 1} {48 - colaW/2},{colaY + colaH * 0.4} {48 - 2},{colaY} {48},{colaY} {48},{stemTop + 1}"
              fill={C.budDense} opacity="0.3" />

      <!-- Calyx-Facetten -->
      {#each Array.from({ length: Math.min(Math.floor(colaH / 3), 7) }, (_, ci) => ci) as ci}
        {@const cy = colaY + 2 + ci * 3}
        {@const cw = Math.max(4, colaW - ci * 1.2)}
        <polygon points="{48 - cw/2},{cy} {48},{cy - 1} {48 + cw/2},{cy} {48},{cy + 2}"
                 fill={ci % 2 === 0 ? C.budGreen : C.calyxLight} opacity="0.7" />
      {/each}

      {#if hasThickBuds}
        <polygon points="{48 - colaW * 0.25},{colaY + colaH * 0.3} {48},{colaY + colaH * 0.15} {48 + colaW * 0.25},{colaY + colaH * 0.3} {48},{colaY + colaH * 0.7}"
                 fill={C.budDense} opacity="0.35" />
      {/if}

      <!-- Pistillen -->
      {#each Array.from({ length: Math.min(woche * 3, 16) }, (_, pi) => pi) as pi}
        {@const px = 48 - colaW/2 + 2 + (pi * 5) % (colaW - 3)}
        {@const py = colaY + 2 + (pi * 7) % Math.max(1, colaH - 4)}
        {@const pColor = pi % 3 === 0 ? C.pistilOrange : pi % 3 === 1 ? C.pistilWhite : C.pistilRed}
        {@const pAngle = -40 + (pi * 30) % 80}
        <line x1={px} y1={py} x2={px + Math.cos(pAngle * Math.PI / 180) * 3}
              y2={py + Math.sin(pAngle * Math.PI / 180) * 3}
              stroke={pColor} stroke-width="0.7" opacity="0.85" stroke-linecap="round" />
      {/each}

      <!-- Trichomes -->
      {#if hasTrichomes}
        {#each Array.from({ length: Math.min(woche * 4, 24) }, (_, ti) => ti) as ti}
          {@const tx = 48 - colaW/2 + 1 + (ti * 7) % (colaW - 1)}
          {@const ty = colaY + 1 + (ti * 5) % Math.max(1, colaH - 2)}
          {@const tColor = woche >= 8 ? C.trichAmber : woche >= 6 ? C.trichMilky : C.trichClear}
          <!-- Trichome als kleines Polygon (Stiel + Kopf) -->
          <line x1={tx} y1={ty} x2={tx} y2={ty - 1.2} stroke={tColor} stroke-width="0.3" opacity="0.5" />
          <circle cx={tx} cy={ty - 1.4} r="0.5"
                  fill={tColor} opacity={0.5 + (ti % 3) * 0.15} />
        {/each}
      {/if}

      <!-- Sugar Leaves -->
      {#if woche >= 3}
        {@html cannabisLeaf(48 - colaW/2, colaY + colaH * 0.4, -1, 7, 3, isFading ? C.fadeYellow : C.leafMid, isFading ? C.fadeBrown : C.canopy)}
        {@html cannabisLeaf(48 + colaW/2, colaY + colaH * 0.6, 1, 7, 3, isFading ? C.fadeYellow : C.leafMid, isFading ? C.fadeBrown : C.canopy)}
      {/if}

      <!-- Side Buds -->
      {#each nodes.slice(0, Math.min(woche - 1, 4)) as node, i}
        {@const budR = Math.min(2 + woche * 0.5, 5)}
        {@const bx = node.side < 0 ? 48 - budR - 4 : 48 + budR + 2}
        <!-- Bud als Polygon statt Ellipse -->
        <polygon points="{bx - budR},{node.y - 2} {bx},{node.y - 2 - budR * 0.7} {bx + budR},{node.y - 2} {bx},{node.y - 2 + budR * 0.5}"
                 fill={C.budGreen} />
        <polygon points="{bx - budR * 0.5},{node.y - 2} {bx},{node.y - 2 - budR * 0.4} {bx + budR * 0.5},{node.y - 2}"
                 fill={C.budLight} opacity="0.35" />
        {#if woche >= 3}
          <line x1={bx} y1={node.y - 2 - budR * 0.7} x2={bx + 1.5} y2={node.y - 2 - budR * 0.7 - 2}
                stroke={C.pistilOrange} stroke-width="0.7" stroke-linecap="round" />
          <line x1={bx - 1} y1={node.y - 2 - budR * 0.5} x2={bx - 2} y2={node.y - 2 - budR * 0.5 - 2}
                stroke={C.pistilWhite} stroke-width="0.7" stroke-linecap="round" opacity="0.8" />
        {/if}
      {/each}
    {/if}

    <!-- ===== PHASE LED (Low-Poly Diamant) ===== -->
    <polygon points="88,3 91,6 88,9 85,6"
             fill={isBloom ? C.bloomRed : isFlush ? C.amberGold : phase.toLowerCase() === 'clone' ? C.waterBlue : C.freshLime}
             opacity="0.9" />
    <polygon points="88,3 91,6 88,6" fill={C.white} opacity="0.15" />
  </svg>
</div>

<style>
  .lp-plant-wrap {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
  .lp-plant-wrap :global(svg) {
    shape-rendering: geometricPrecision;
    animation: sway 4s ease-in-out infinite;
    transform-origin: bottom center;
  }
  @keyframes sway {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(0.5deg); }
    75% { transform: rotate(-0.5deg); }
  }
  .apex-grow {
    animation: pulse-grow 2s ease-in-out infinite;
  }
  @keyframes pulse-grow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }
</style>
