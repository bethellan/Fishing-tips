(function(global){
  const drawer=document.getElementById('drawer');
  const content=document.getElementById('drawerContent');
  const title=document.getElementById('drawerTitle');
  const btnOpen=document.getElementById('openDrawerBtn');
  const btnClose=document.getElementById('drawerClose');
  const rangeSel=document.getElementById('forecastRange');

  function fmtDir(d){ const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSW','SW','WSW','W','WNW','NW','NNW']; return dirs[Math.round(((d%360)/22.5))%16]; }

  async function fetchOpenMeteo(lat,lng){
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto`;
    const r = await fetch(url); return await r.json();
  }
  async function fetchMarine(lat,lng){
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,wave_period&timezone=auto`;
    const r = await fetch(url); return await r.json();
  }

  async function fetchTides(lat,lng){
    const cfg = (global.APP_CONFIG||{}).tides||{};
    if(!cfg.provider){ return {disabled:true, message:"Tides not configured. Add a provider API key in APP_CONFIG."}; }
    if(cfg.provider === 'worldtides'){
      if(!cfg.apiKey){ return {disabled:true, message:"WorldTides key missing. Add APP_CONFIG.tides.apiKey."}; }
      // Basic call: return next few hours of tide heights at given lat/lng
      const now = Math.floor(Date.now()/1000);
      const url = `https://www.worldtides.info/api/v3?heights&lat=${lat}&lon=${lng}&start=${now}&length=86400&key=${encodeURIComponent(cfg.apiKey)}`;
      try { const r = await fetch(url); const j = await r.json(); return {provider:'worldtides', data:j}; }
      catch(e){ return {error:String(e)}; }
    }
    return {disabled:true, message:"Unknown tide provider."};
  }

  function verdict(ws, wh){
    if(wh<=0.6 && ws<=15) return 'Calm & clean — great for moki/ledger rigs.';
    if(wh<=1.2 && ws<=25) return 'Moderate surf — good kahawai/gurnard chances.';
    return 'Rough — fish gutters/river mouths, heavier gear.';
  }

  async function openFor(lat,lng,name){
    drawer.classList.remove('hidden'); title.textContent = 'Conditions';
    content.innerHTML = `<div class="small">Loading forecast for <strong>${name}</strong>…</div>`;
    try{
      const [wx, sea, tides] = await Promise.all([fetchOpenMeteo(lat,lng), fetchMarine(lat,lng), fetchTides(lat,lng)]);
      const i=0;
      const t=wx?.hourly?.temperature_2m?.[i], ws=wx?.hourly?.wind_speed_10m?.[i], wd=wx?.hourly?.wind_direction_10m?.[i];
      const wh=sea?.hourly?.wave_height?.[i], wp=sea?.hourly?.wave_period?.[i];
      const wdir = (typeof wd==='number')? fmtDir(wd) : '—';

      let tidesHTML = '';
      if(tides?.disabled){ tidesHTML = `<div class="small">Tides: ${tides.message}</div>`; }
      else if(tides?.error){ tidesHTML = `<div class="small" style="color:#f88">Tides: ${tides.error}</div>`; }
      else if(tides?.provider==='worldtides' && Array.isArray(tides.data?.heights)){
        const sample = tides.data.heights.slice(0,6).map(h => {
          const dt = new Date(h.dt*1000); return `${dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}: ${h.height.toFixed(2)} m`;
        }).join('<br/>');
        tidesHTML = `<div class="small">Tides (WorldTides):<br/>${sample}</div>`;
      } else {
        tidesHTML = `<div class="small">Tides: (no data returned)</div>`;
      }

      content.innerHTML = `<div><strong>${name}</strong></div><div class="rule"></div>
        <div>Wind: <strong>${ws??'—'} km/h ${wdir}</strong></div>
        <div>Air: <strong>${t??'—'} °C</strong></div>
        <div>Swell: <strong>${wh??'—'} m @ ${wp??'—'} s</strong></div>
        ${tidesHTML}
        <div class="rule"></div>
        <div>${verdict(ws||0, wh||0)}</div>`;
    }catch(e){
      content.innerHTML = `<div style="color:#f88">Could not load conditions. ${e}</div>`;
    }
  }

  btnOpen.addEventListener('click', ()=> drawer.classList.remove('hidden'));
  btnClose.addEventListener('click', ()=> drawer.classList.add('hidden'));
  rangeSel.addEventListener('change', ()=>{}); // reserved (today vs 7d; currently advisory only)

  global.ConditionsDrawer = { openFor };
})(window);
