(function (global) {
  const drawer = document.getElementById('drawer');
  const content = document.getElementById('drawerContent');
  const title = document.getElementById('drawerTitle');

  // Default advice by species (used to backfill)
  const BASE = {
    "Snapper":       { rig:"ledger or strayline", hooks:"recurve 5/0–7/0", attractors:"lumo beads + small rubber octopus", colour:"red/green", baits:"squid, pilchard, bonito", burley:"pilchard/mussel trail; small but steady", best:"dusk–night", tide:"incoming/turning light", monthHeat:[0,0,0,0,1,1,1,1,1,0,0,0] },
    "Kahawai":       { rig:"2-hook ledger or spinner", hooks:"circle 3/0", attractors:"flashers or lumo string", colour:"green/chartreuse", baits:"pilchard strips", burley:"minimal (surface splatter ok)", best:"dawn with baitfish", tide:"incoming", monthHeat:[1,1,1,1,1,1,1,1,1,1,1,1] },
    "Gurnard":       { rig:"ledger, small long-drops", hooks:"1/0–2/0 circle", attractors:"orange/red lumo beads", colour:"orange/red", baits:"bonito/squid cubes", burley:"very light on bottom", best:"daylight after swell drop", tide:"any", monthHeat:[0,1,1,1,1,1,1,1,1,1,0,0] },
    "Blue Moki":     { rig:"long trace ledger", hooks:"2/0–3/0 beak", attractors:"green lumo beads", colour:"green", baits:"crab, prawn, mussel", burley:"shellfish mash small doses", best:"night to first light", tide:"incoming", monthHeat:[0,0,0,1,1,1,1,1,1,1,0,0] },
    "Tarakihi":      { rig:"paternoster/ledger small", hooks:"1/0 beak", attractors:"white/blue flash", colour:"white/blue", baits:"pipi, prawn, squid strip", burley:"minimal", best:"low-light", tide:"slack to early run", monthHeat:[0,0,0,1,1,1,1,1,1,0,0,0] },
    "Yellowtail Kingfish": { rig:"live-bait under balloon", hooks:"7/0 live-bait", attractors:"—", colour:"—", baits:"jack mackerel, kahawai", burley:"use to hold baitfish only", best:"midday if bait present", tide:"any", monthHeat:[0,0,0,1,1,1,1,1,0,0,0,0] },
    "Rig (Spotted Smoothhound)": { rig:"ledger, long traces", hooks:"5/0 beak", attractors:"green lumo beads", colour:"green", baits:"crab/prawn", burley:"none", best:"dusk–night", tide:"incoming", monthHeat:[0,0,0,0,1,1,1,1,1,1,0,0] },
    "School Shark (Tope)": { rig:"wire trace ledger", hooks:"6/0–8/0", attractors:"—", colour:"—", baits:"fresh fish baits", burley:"none", best:"night", tide:"any", monthHeat:[0,0,0,0,1,1,1,1,1,1,0,0] },
    "Trevally":      { rig:"small hooks, light trace", hooks:"1/0 circle", attractors:"flashers", colour:"pink/blue", baits:"pipi, prawn, shellfish", burley:"small shell burley", best:"late arvo", tide:"incoming", monthHeat:[0,0,1,1,1,1,1,1,0,0,0,0] },
    "John Dory":     { rig:"live-bait close in", hooks:"5/0–6/0", attractors:"—", colour:"—", baits:"small live kahawai", burley:"none", best:"low light", tide:"any", monthHeat:[0,0,0,1,1,1,1,1,0,0,0,0] },
    "Rays":          { rig:"heavy ledger", hooks:"8/0+", attractors:"—", colour:"—", baits:"big squid slabs", burley:"none", best:"night", tide:"any", monthHeat:[1,1,1,1,1,1,1,1,1,1,1,1] },
    "Spiny Dogfish": { rig:"ledger", hooks:"3/0–4/0", attractors:"—", colour:"—", baits:"anything oily", burley:"avoid", best:"night", tide:"any", monthHeat:[1,1,1,1,1,1,1,1,1,1,1,1] },
    "Blue Cod (shore rare)": { rig:"ledger to rough foul", hooks:"3/0", attractors:"—", colour:"—", baits:"squid", burley:"minimal", best:"day", tide:"slack", monthHeat:[0,0,0,0,1,1,1,1,0,0,0,0] }
  };

  function ensureAdvice(spot) {
    spot.speciesAdvice = spot.speciesAdvice || {};
    (spot.targetSpecies||[]).forEach(sp => {
      if (!spot.speciesAdvice[sp]) spot.speciesAdvice[sp] = {...BASE[sp]};
    });
  }

  function renderAdvice(spot){
    ensureAdvice(spot);
    const rows = Object.keys(spot.speciesAdvice).map(sp=>{
      const a = spot.speciesAdvice[sp];
      return `<div style="margin:8px 0;">
        <div><strong>${sp}</strong></div>
        <div class="small">Rig: <b>${a.rig||'—'}</b> • Hooks: <b>${a.hooks||'—'}</b></div>
        <div class="small">Attractors: <b>${a.attractors||'—'}</b> • Colour: <b>${a.colour||'—'}</b></div>
        <div class="small">Baits: <b>${a.baits||'—'}</b> • Burley: <b>${a.burley||'—'}</b></div>
        <div class="small">Best time: <b>${a.best||'—'}</b> • Best tide: <b>${a.tide||'—'}</b></div>
      </div>`;
    }).join('<div class="rule"></div>');
    return `<div><strong>${spot.name}</strong><div class="rule"></div>${rows}</div>`;
  }

  function openFor(spot){
    drawer.classList.remove('hidden');
    title.textContent = 'Spot Advice';
    content.innerHTML = renderAdvice(spot);
  }

  global.AdviceDrawer = { openFor, ensureAdvice, BASE };
})(window);
