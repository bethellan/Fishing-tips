(function(global){
  let ctx=null;

  function score(spot,sample){
    const ws=sample.wind||0, wh=sample.wave||0;
    let sc=0;
    if(wh<=0.6) sc+=3; else if(wh<=1.2) sc+=2;
    if(ws<=15) sc+=2; else if(ws<=25) sc+=1;
    if(spot.livebaitable) sc+=1;
    if((spot.substrate||[]).includes('sand')) sc+=1;
    if((spot.substrate||[]).includes('reef')) sc+=1;
    return sc;
  }
  async function marineSample(lat,lng){
    try{ const r=await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height&timezone=auto`);
      const j=await r.json(); return {wave:j?.hourly?.wave_height?.[0]||1.0}; }catch(e){ return {wave:1.0}; }
  }
  async function windSample(lat,lng){
    try{ const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m&wind_speed_unit=kmh&timezone=auto`);
      const j=await r.json(); return {wind:j?.hourly?.wind_speed_10m?.[0]||15}; }catch(e){ return {wind:15}; }
  }
  async function rankTop(spots,topN){
    const out=[];
    for(const s of spots){
      const [w,m]=await Promise.all([windSample(s.lat,s.lng), marineSample(s.lat,s.lng)]);
      const sample={wind:w.wind,wave:m.wave};
      out.push({spot:s,score:score(s,sample),sample});
    }
    out.sort((a,b)=>b.score-a.score);
    return out.slice(0,topN);
  }

  function showList(items){
    const drawer=document.getElementById('drawer'); const content=document.getElementById('drawerContent'); const title=document.getElementById('drawerTitle');
    drawer.classList.remove('hidden'); title.textContent='Hot Spots (next 3 days)';
    content.innerHTML = items.map(it=>`<div class="hotspot-item" data-lat="${it.spot.lat}" data-lng="${it.spot.lng}" data-name="${it.spot.name}">
      <div><strong>${it.spot.name}</strong> • ${it.spot.region}</div>
      <div class="small">Score: ${it.score} • Wind≈${it.sample.wind} km/h • Swell≈${it.sample.wave} m</div>
      <div class="small">Species: ${(it.spot.targetSpecies||[]).join(', ')||'—'}</div>
    </div>`).join('');
    content.querySelectorAll('.hotspot-item').forEach(el=>{
      el.style.cursor='pointer';
      el.addEventListener('click', ()=>{
        const lat=parseFloat(el.getAttribute('data-lat')); const lng=parseFloat(el.getAttribute('data-lng'));
        window.__focusOn && window.__focusOn(lat,lng,el.getAttribute('data-name'));
      });
    });
  }

  async function trigger(){
    const regionSel=document.getElementById('regionSelect'); const accessSel=document.getElementById('accessSelect');
    let spots=(ctx.getSpots?ctx.getSpots():[]).slice();
    if(regionSel && regionSel.value && regionSel.value!=='All regions'){ spots=spots.filter(s=>s.region===regionSel.value); }
    if(accessSel && accessSel.value){ spots=spots.filter(s=>(s.accessType||'surf')===accessSel.value); }
    if(!spots.length) return;
    const ranked=await rankTop(spots,ctx.topN||5); showList(ranked);
  }
  function init(_ctx){ ctx=_ctx||{}; }

  global.HotSpots = { init, trigger };
})(window);
