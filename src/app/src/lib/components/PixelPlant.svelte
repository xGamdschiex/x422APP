<script lang="ts">
  export let phase: string = 'keimung';
  export let woche: number = 1;
  export let tag: number = 1;

  $: ph = phase.toLowerCase();
  $: isKeimung = ph === 'keimung';
  $: isVeg     = ph === 'veg';
  $: isBluete  = ph === 'bluete' || ph === 'bloom';
  $: isTrocknung = ph === 'trocknung' || ph === 'flush';
  $: isCuring  = ph === 'curing';
  $: isFading  = (isBluete && woche >= 8) || isTrocknung;

  // ── Wachstumsparameter ────────────────────────────────────────────────────
  $: keimTag = Math.min(Math.max(tag, 1), 4);

  // Stammhöhe (SVG-Einheiten, Basis bei y=82)
  $: stemH = isKeimung ? keimTag * 6 :
             isVeg      ? 24 + Math.min(woche, 6) * 9 :
             isBluete   ? 78 + Math.min(woche, 3) * 3 :
             isTrocknung ? 0 : 0;

  $: soilY = 82;
  $: stemTop = soilY - stemH;

  // Blattgröße
  $: leafSize = isKeimung && keimTag >= 3 ? 8 + keimTag * 2 :
                isVeg    ? 14 + Math.min(woche, 6) * 3.5 :
                isBluete ? 26 + Math.min(woche, 4) * 1.5 : 0;

  // Fingeranzahl
  $: fingers = isKeimung ? 1 :
               isVeg && woche <= 2 ? 3 :
               isVeg && woche <= 4 ? 5 : 7;

  // Nodenzahl
  $: nodeCount = isKeimung && keimTag >= 4 ? 1 :
                 isVeg   ? Math.min(1 + woche, 6) :
                 isBluete ? 5 : 0;

  $: nodes = Array.from({ length: nodeCount }, (_, i) => {
    const spacing = stemH / (nodeCount + 1);
    const y = stemTop + spacing * (i + 1);
    const age = 1 - i / nodeCount;
    const size = leafSize * (0.55 + age * 0.45);
    const fc = size > 22 ? 7 : size > 14 ? 5 : size > 8 ? 3 : 1;
    return { y, size, fc, side: i % 2 === 0 ? -1 : 1 };
  });

  // Knospen-Fortschritt
  $: budProgress = isBluete ? Math.min(woche / 10, 1) : 0;
  $: budH = isBluete ? Math.min(8 + woche * 3.5, 38) : 0;
  $: budW = isBluete ? Math.min(5 + woche * 1.2, 16) : 0;

  // Farben
  $: lc  = isFading ? '#8a9235' : isBluete && woche > 5 ? '#3a7228' : '#4a9038';
  $: lh  = isFading ? '#b0a828' : '#72c048';
  $: ld  = isFading ? '#5a6218' : '#286020';
  $: bc  = isBluete && woche >= 7 ? '#b0a028' : '#4a7830';
  $: bh  = isBluete && woche >= 7 ? '#d4c040' : '#6a9848';

  // ── Hilfsfunktionen ───────────────────────────────────────────────────────

  // Einzelnes Blatt als Bezier-Pfad (Richtung: Winkel in Grad)
  function leaflet(ox: number, oy: number, angleDeg: number, len: number, wid: number, fill: string): string {
    const r = (angleDeg * Math.PI) / 180;
    const pr = r + Math.PI / 2;
    const ex = ox + Math.cos(r) * len;
    const ey = oy + Math.sin(r) * len;
    const w2 = wid / 2;
    const lx = ox + Math.cos(pr) * w2,  ly = oy + Math.sin(pr) * w2;
    const rx = ox - Math.cos(pr) * w2,  ry = oy - Math.sin(pr) * w2;
    const mx = ox + Math.cos(r) * len * 0.52,  my = oy + Math.sin(r) * len * 0.52;
    const c1x = mx + Math.cos(pr) * wid * 0.8, c1y = my + Math.sin(pr) * wid * 0.8;
    const c2x = mx - Math.cos(pr) * wid * 0.8, c2y = my - Math.sin(pr) * wid * 0.8;
    const f = (n: number) => n.toFixed(1);
    return `<path d="M${f(lx)},${f(ly)} Q${f(c1x)},${f(c1y)} ${f(ex)},${f(ey)} Q${f(c2x)},${f(c2y)} ${f(rx)},${f(ry)} Z" fill="${fill}"/>
<line x1="${f(ox)}" y1="${f(oy)}" x2="${f(ex)}" y2="${f(ey)}" stroke="${ld}" stroke-width="0.5" opacity="0.55" stroke-linecap="round"/>`;
  }

  // Vollständiges Cannabis-Blatt (Fächerblatt mit Petiole)
  function cannabisLeaf(cx: number, cy: number, dir: number, size: number, fc: number): string {
    const baseAngle = dir < 0 ? 195 : -15;
    const pLen = size * 0.38;
    const pr = (baseAngle * Math.PI) / 180;
    const px = cx + Math.cos(pr) * pLen;
    const py = cy + Math.sin(pr) * pLen;
    const f = (n: number) => n.toFixed(1);
    let parts = [`<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(px)}" y2="${f(py)}" stroke="${ld}" stroke-width="1" stroke-linecap="round"/>`];

    // Finger-Konfigurationen: [Winkel-Offset, Längen-Faktor]
    const cfgs: [number, number][] =
      fc >= 7 ? [[0,1],[dir*28,0.82],[dir*-28,0.82],[dir*56,0.60],[dir*-56,0.60],[dir*82,0.38],[dir*-82,0.38]] :
      fc >= 5 ? [[0,1],[dir*32,0.78],[dir*-32,0.78],[dir*62,0.50],[dir*-62,0.50]] :
      fc >= 3 ? [[0,1],[dir*38,0.65],[dir*-38,0.65]] :
                [[0,1]];

    cfgs.forEach(([offset, scale]) => {
      const ang = baseAngle - 90 + offset;
      const len = size * scale * 0.68;
      const wid = len * 0.28;
      const depth = Math.abs(offset) > 50 ? ld : Math.abs(offset) > 25 ? lc : lh;
      parts.push(leaflet(px, py, ang, len, wid, depth));
    });
    return parts.join('\n');
  }

  // Knospen-Calyx-Cluster
  function budCalyx(x: number, y: number, r: number, idx: number): string {
    const fill = idx % 2 === 0 ? bc : bh;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r*0.9).toFixed(1)}" ry="${r.toFixed(1)}" fill="${fill}" opacity="0.92"/>
<ellipse cx="${(x-r*0.2).toFixed(1)}" cy="${(y-r*0.4).toFixed(1)}" rx="${(r*0.4).toFixed(1)}" ry="${(r*0.35).toFixed(1)}" fill="${bh}" opacity="0.35"/>`;
  }

  // Pistill (Haar)
  function pistil(x: number, y: number, idx: number): string {
    const a = -70 + (idx * 47) % 140;
    const r = (a * Math.PI) / 180;
    const len = 3 + (idx % 3);
    const ex = x + Math.cos(r) * len, ey = y + Math.sin(r) * len;
    const c = idx % 3 === 0 ? '#e87030' : idx % 3 === 1 ? '#cc3a18' : '#f0a848';
    return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${c}" stroke-width="0.65" stroke-linecap="round" opacity="0.9"/>`;
  }
</script>

<div class="plant-wrap">
<svg viewBox="0 0 100 110" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Topf-Verlauf -->
    <linearGradient id="pot-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#c46828"/>
      <stop offset="30%"  stop-color="#de8840"/>
      <stop offset="65%"  stop-color="#be6020"/>
      <stop offset="100%" stop-color="#8b3e10"/>
    </linearGradient>
    <linearGradient id="rim-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#d47838"/>
      <stop offset="40%"  stop-color="#ee9850"/>
      <stop offset="100%" stop-color="#a05020"/>
    </linearGradient>
    <radialGradient id="soil-g" cx="45%" cy="35%">
      <stop offset="0%"   stop-color="#5a3820"/>
      <stop offset="100%" stop-color="#2a1408"/>
    </radialGradient>
    <radialGradient id="shadow-g" cx="50%" cy="50%">
      <stop offset="0%"   stop-color="#000" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <!-- Keimungs-Farben -->
    <linearGradient id="seed-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#8b6030"/>
      <stop offset="100%" stop-color="#5a3818"/>
    </linearGradient>
    <linearGradient id="sprout-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#88cc44"/>
      <stop offset="100%" stop-color="#5a9828"/>
    </linearGradient>
    <!-- Blatt-Verlauf -->
    <linearGradient id="leaf-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#72c048"/>
      <stop offset="100%" stop-color="#2d6018"/>
    </linearGradient>
    <!-- Knospen-Verlauf -->
    <linearGradient id="bud-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#6a9840"/>
      <stop offset="100%" stop-color="#385820"/>
    </linearGradient>
    <!-- Trichom-Glanz -->
    <radialGradient id="trich-g" cx="50%" cy="30%">
      <stop offset="0%"   stop-color="#f8f0c0" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#c8a030" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- ── Schatten ── -->
  <ellipse cx="50" cy="108" rx="18" ry="3" fill="url(#shadow-g)"/>

  {#if isCuring}
    <!-- ── CURING: Buds im Glas ── -->
    <rect x="28" y="52" width="44" height="48" rx="6" ry="6"
          fill="#d8e8f0" opacity="0.6" stroke="#a0b8c8" stroke-width="1.5"/>
    <rect x="24" y="48" width="52" height="10" rx="4" ry="4"
          fill="#b8c8d8" stroke="#889ab0" stroke-width="1"/>
    <!-- Label -->
    <rect x="30" y="65" width="40" height="18" rx="3" fill="#fff8e8" opacity="0.7"/>
    <line x1="33" y1="70" x2="67" y2="70" stroke="#c0a060" stroke-width="1" opacity="0.5"/>
    <line x1="33" y1="74" x2="58" y2="74" stroke="#c0a060" stroke-width="0.7" opacity="0.5"/>
    <!-- Buds im Glas -->
    {#each [[42,60],[56,62],[48,72],[38,70],[60,70]] as [bx,by], i}
      {@html budCalyx(bx, by, 4.5 - i * 0.3, i)}
      {#each [0,1,2] as pi}
        {@html pistil(bx, by - 3, i * 3 + pi)}
      {/each}
    {/each}
    <!-- Trichom-Glanz -->
    <ellipse cx="50" cy="63" rx="20" ry="14" fill="url(#trich-g)"/>

  {:else if isTrocknung}
    <!-- ── TROCKNUNG: Hängende Zweige ── -->
    <!-- Aufhänge-Schnur -->
    <line x1="30" y1="20" x2="70" y2="20" stroke="#8b7040" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="50" y1="20" x2="50" y2="25" stroke="#6b5020" stroke-width="1"/>
    <!-- Stängel hängend -->
    <path d="M50,25 C48,35 46,55 45,75" stroke="#5a6820" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M50,25 C52,35 54,55 55,75" stroke="#4a5818" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- Hängende Blätter (fade) -->
    {#each [[40,38,-1],[57,42,1],[37,52,-1],[58,56,1],[40,65,-1],[56,68,1]] as [lx,ly,ld2], i}
      <path d="M{lx},{ly} Q{lx+ld2*12},{ly+4+i} {lx+ld2*8},{ly+14+i}"
            fill="#7a8830" opacity="{0.8 - i*0.08}" stroke="none"/>
      <path d="M{lx},{ly} Q{lx+ld2*8},{ly+2+i} {lx+ld2*6},{ly+11+i}"
            fill="#5a6820" opacity="0.4" stroke="none"/>
    {/each}
    <!-- Trockene getrimmt Buds -->
    {#each [[43,62],[50,58],[57,62]] as [bx,by], i}
      <ellipse cx={bx} cy={by} rx="4" ry="5.5" fill="#6a7a30" opacity="0.85"/>
      <ellipse cx={bx-1} cy={by-2} rx="1.8" ry="1.5" fill="#8a9a40" opacity="0.4"/>
    {/each}
    <!-- Aufhänge-Clips -->
    <rect x="47" y="18" width="6" height="5" rx="2" fill="#6b5020" stroke="#4a3810" stroke-width="0.5"/>

  {:else}
    <!-- ── TOPF (alle anderen Phasen) ── -->
    <path d="M31,{soilY} Q30,{soilY+16} 35,{soilY+20} L65,{soilY+20} Q70,{soilY+16} 69,{soilY} Z"
          fill="url(#pot-g)"/>
    <!-- Topf Schatten-Seite -->
    <path d="M49,{soilY} Q49,{soilY+16} 51,{soilY+20} L65,{soilY+20} Q70,{soilY+16} 69,{soilY} Z"
          fill="#8b3e10" opacity="0.3"/>
    <!-- Topfrand -->
    <path d="M27,{soilY-4} Q50,{soilY-7} 73,{soilY-4} Q73,{soilY+1} 69,{soilY} Q50,{soilY-3} 31,{soilY} Q27,{soilY+1} 27,{soilY-4} Z"
          fill="url(#rim-g)"/>
    <!-- Glanz auf Rand -->
    <path d="M30,{soilY-4} Q50,{soilY-6} 68,{soilY-4} Q50,{soilY-5} 30,{soilY-4} Z"
          fill="#fff" opacity="0.18"/>
    <!-- Erde -->
    <ellipse cx="50" cy={soilY} rx="19" ry="4.5" fill="url(#soil-g)"/>
    <!-- Erde-Highlight -->
    <ellipse cx="44" cy={soilY-1} rx="7" ry="2" fill="#7a5030" opacity="0.3"/>

    {#if isKeimung}
      <!-- ── KEIMUNG ── -->

      {#if keimTag === 1}
        <!-- Samen auf Erde -->
        <ellipse cx="50" cy={soilY-1} rx="4" ry="3" fill="url(#seed-g)"/>
        <ellipse cx="48" cy={soilY-2} rx="1.5" ry="1" fill="#a07848" opacity="0.5"/>
        <path d="M50,{soilY-4} Q51,{soilY-5} 50,{soilY-4}" stroke="#6b4820" stroke-width="0.5" fill="none"/>

      {:else if keimTag === 2}
        <!-- Keimwurzel bricht durch -->
        <ellipse cx="50" cy={soilY-1} rx="3.5" ry="2.5" fill="url(#seed-g)"/>
        <!-- Weißer Keimling -->
        <path d="M50,{soilY-1} Q49,{soilY-6} 50,{soilY-9}" stroke="#d8ecc0" stroke-width="2" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy={soilY-10} rx="2.5" ry="1.8" fill="#c8e8a0" opacity="0.9"/>

      {:else if keimTag === 3}
        <!-- Keimling mit Keimblättern -->
        <path d="M50,{soilY} Q49.5,{soilY-12} 50,{soilY-14}" stroke="#6ab030" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Keimblätter (cotyledons) -->
        <path d="M50,{soilY-14} Q43,{soilY-17} 41,{soilY-13} Q43,{soilY-10} 50,{soilY-14} Z"
              fill="#90d050" opacity="0.95"/>
        <path d="M50,{soilY-14} Q57,{soilY-17} 59,{soilY-13} Q57,{soilY-10} 50,{soilY-14} Z"
              fill="#78c040" opacity="0.95"/>
        <ellipse cx="45" cy={soilY-15} rx="2" ry="1.2" fill="#b0e878" opacity="0.3"/>
        <ellipse cx="55" cy={soilY-15} rx="2" ry="1.2" fill="#b0e878" opacity="0.3"/>

      {:else}
        <!-- Keimling + erste echte Blätter -->
        <path d="M50,{soilY} Q49,{soilY-20} 50,{soilY-22}" stroke="#5aa020" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Keimblätter -->
        <path d="M50,{soilY-18} Q43,{soilY-21} 41,{soilY-17} Q43,{soilY-14} 50,{soilY-18} Z"
              fill="#78c038" opacity="0.85"/>
        <path d="M50,{soilY-18} Q57,{soilY-21} 59,{soilY-17} Q57,{soilY-14} 50,{soilY-18} Z"
              fill="#68b030" opacity="0.85"/>
        <!-- Erste echte Blätter -->
        {@html cannabisLeaf(50, soilY - 22, -1, 10, 1)}
        {@html cannabisLeaf(50, soilY - 22,  1, 10, 1)}
        <!-- Apex -->
        <ellipse cx="50" cy={soilY-24} rx="2" ry="2.5" fill="#98e060"/>
      {/if}

    {:else if isVeg || isBluete}
      <!-- ── VEG & BLUETE: Stamm ── -->
      <!-- Stamm-Schatten -->
      <path d="M50,{soilY} Q49.5,{stemTop+4} 50,{stemTop}"
            stroke={isFading ? '#5a6820' : '#3a7020'} stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.3"/>
      <!-- Stamm -->
      <path d="M50,{soilY} Q50.5,{stemTop+4} 50,{stemTop}"
            stroke={isFading ? '#6a7828' : '#4a8828'} stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <!-- Stamm-Highlight -->
      <path d="M49.5,{soilY} Q49,{stemTop+4} 49.5,{stemTop}"
            stroke="#a0d860" stroke-width="0.7" fill="none" stroke-linecap="round" opacity="0.35"/>

      <!-- Nodes + Blätter -->
      {#each nodes as node, i}
        <!-- Node-Knubbel -->
        <ellipse cx="50" cy={node.y} rx="1.8" ry="1.5" fill={ld} opacity="0.7"/>
        {@html cannabisLeaf(50, node.y, node.side, node.size, node.fc)}
      {/each}

      {#if isBluete && woche >= 2}
        <!-- ── MAIN COLA (Hauptknospe) ── -->
        {@const colaX = 50}
        {@const colaY = stemTop - budH + 4}

        <!-- Cola-Körper -->
        <path d="M{colaX-budW/2+2},{stemTop+2} Q{colaX-budW/2},{colaY+budH*0.5} {colaX-budW/3},{colaY} Q{colaX},{colaY-3} {colaX+budW/3},{colaY} Q{colaX+budW/2},{colaY+budH*0.5} {colaX+budW/2-2},{stemTop+2} Z"
              fill="url(#bud-g)" opacity="0.95"/>
        <!-- Cola Schatten -->
        <path d="M{colaX},{stemTop+2} Q{colaX},{colaY+budH*0.5} {colaX-budW/3},{colaY} Q{colaX-budW/4},{colaY+budH*0.3} {colaX},{stemTop+2} Z"
              fill={ld} opacity="0.25"/>

        <!-- Calyx-Cluster entlang der Cola -->
        {#each Array.from({length: Math.min(Math.ceil(budH/4.5), 9)}, (_,ci) => ci) as ci}
          {@const cy2 = colaY + 3 + ci * (budH - 3) / Math.max(1, Math.ceil(budH/4.5) - 1)}
          {@const cw = budW * (1 - ci / 20)}
          {@html budCalyx(colaX, cy2, cw * 0.45, ci)}
          <!-- Pistillen -->
          {#if woche >= 2}
            {#each [0,1,2,3] as pi}
              {@html pistil(colaX - cw*0.2 + pi * cw*0.13, cy2 - cw*0.3, ci * 4 + pi)}
            {/each}
          {/if}
        {/each}

        <!-- Trichom-Glanz (späte Bluete) -->
        {#if woche >= 5}
          <ellipse cx={colaX} cy={colaY + budH * 0.4} rx={budW*0.6} ry={budH*0.5}
                   fill="url(#trich-g)" opacity={0.15 + (woche - 5) * 0.08}/>
        {/if}

        <!-- Seitenknöpfe -->
        {#each nodes.slice(0, Math.min(woche - 1, 5)) as node, i}
          {@const sbx = node.side < 0 ? 50 - 12 : 50 + 10}
          {@const sbH = Math.min(4 + woche * 1.5, 14)}
          {@const sbW = Math.min(3 + woche * 0.6, 8)}
          <path d="M{sbx},{node.y} Q{sbx-sbW/2},{node.y-sbH*0.6} {sbx},{node.y-sbH} Q{sbx+sbW/2},{node.y-sbH*0.6} {sbx+sbW/2},{node.y} Z"
                fill={bc} opacity="0.85"/>
          {#each [0,1,2] as pi}
            {@html pistil(sbx, node.y - sbH * 0.8, i * 3 + pi)}
          {/each}
        {/each}

        <!-- Sugar Leaves (späte Bluete) -->
        {#if woche >= 3}
          {@html cannabisLeaf(colaX - budW*0.5, colaY + budH*0.4, -1, leafSize * 0.6, 3)}
          {@html cannabisLeaf(colaX + budW*0.5, colaY + budH*0.6,  1, leafSize * 0.6, 3)}
        {/if}

      {:else if isVeg}
        <!-- Apex (Veg) -->
        <path d="M48,{stemTop} Q50,{stemTop-8} 52,{stemTop}" fill={lh} opacity="0.9"/>
        <ellipse cx="50" cy={stemTop-2} rx="2.5" ry="3" fill="#98e060" class="apex"/>
        <ellipse cx="49" cy={stemTop-3} rx="1" ry="1.2" fill="#c0f080" opacity="0.5"/>
      {/if}
    {/if}
  {/if}
</svg>
</div>

<style>
  .plant-wrap {
    display: flex;
    justify-content: center;
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.35));
    animation: sway 4s ease-in-out infinite;
    transform-origin: bottom center;
  }
  @keyframes sway {
    0%, 100% { transform: rotate(0deg); }
    30%       { transform: rotate(0.6deg); }
    70%       { transform: rotate(-0.6deg); }
  }
  .apex {
    animation: pulse 2.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.9; }
    50%       { opacity: 0.55; }
  }
</style>
