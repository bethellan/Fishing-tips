(function(){
  const btn = document.getElementById('checkBtn');
  const drawer=document.getElementById('drawer');
  const content=document.getElementById('drawerContent');
  const title=document.getElementById('drawerTitle');

  function countsByRegion(spots){
    const out={}; spots.forEach(s=> out[s.region]=(out[s.region]||0)+1 ); return out;
  }
  function coastalPlausible(s){ return s.lng>172 && s.lng<178 && s.lat<-35 && s.lat>-42; }

  btn.addEventListener('click', ()=>{
    const SPOTS = window.__SPOTS__ || [];
    const counts = countsByRegion(SPOTS);
    const rows = Object.keys(counts).sort().map(r=>`<tr><td>${r}</td><td style="text-align:right">${counts[r]}</td></tr>`).join('');
    const wgtnOk = (counts['Wellington Harbour']||0) >= 15;
    const wairarapa = SPOTS.filter(s=>s.region==='Wairarapa Coast');
    const wairarapaOk = wairarapa.length>=10 && wairarapa.every(coastalPlausible);

    drawer.classList.remove('hidden'); title.textContent='Self-check';
    content.innerHTML = `
      <div><strong>Total spots:</strong> ${SPOTS.length}</div>
      <div class="rule"></div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th style="text-align:left">Region</th><th style="text-align:right">Count</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="rule"></div>
      <div>Miramar coverage (≥15 in Wellington Harbour): <b style="color:${wgtnOk?'#7fff7f':'#ff8'}">${wgtnOk?'OK':'Needs more'}</b></div>
      <div>Wairarapa (≥10 & coastal coords): <b style="color:${wairarapaOk?'#7fff7f':'#ff8'}">${wairarapaOk?'OK':'Check coords'}</b></div>
    `;
  });
})();
