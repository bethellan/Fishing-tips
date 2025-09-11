(function(global){
  const UIFilters = {};
  let MAP=null, BAR=null, SPECIES=null;

  async function loadSpecies(){
    if(SPECIES) return SPECIES;
    const url = (global.APP_CONFIG && global.APP_CONFIG.speciesIndexUrl) || 'data/species_wlg_kapiti.json';
    const res = await fetch(url);
    SPECIES = await res.json(); return SPECIES;
  }
  function month(){ return (new Date()).getMonth(); }

  function buildBar(){
    if(BAR) return BAR;
    const bar = document.createElement('div');
    bar.style.cssText='position:absolute;top:10px;left:50%;transform:translateX(-50%);background:#fff;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.15);padding:6px 10px;display:flex;gap:8px;align-items:center;z-index:9999;';
    const hot = document.createElement('button');
    hot.textContent = '🔥 Biting now'; hot.style.cssText='padding:6px 10px;border-radius:999px;border:1px solid #ddd;cursor:pointer;';
    hot.onclick = applyBitingNow;
    const sel = document.createElement('select'); sel.innerHTML='<option value=\"\">All species</option>'; sel.style.cssText='padding:6px;border-radius:8px;';
    sel.onchange=()=>applySpecies(sel.value);
    const reset = document.createElement('button'); reset.textContent='Reset'; reset.style.cssText='padding:6px 10px;border-radius:8px;border:1px solid #ddd;';
    reset.onclick = resetAll;
    bar.append(hot, sel, reset); BAR = bar; return bar;
  }
  async function populate(){
    const data = await loadSpecies();
    const sel = BAR.querySelector('select');
    const names = Array.from(new Set((data.species||[]).map(s=>s.commonName))).sort();
    names.forEach(n=>{ const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
  }
  function eachMarker(fn){
    MAP.eachLayer(l=>{
      if(l instanceof L.Marker){ fn(l); }
      else if(l && l.eachLayer){ try{ l.eachLayer(m => (m instanceof L.Marker) && fn(m)); }catch(e){} }
    });
  }
  function props(m){
    const f = m.feature && m.feature.properties ? m.feature : (m.options && m.options.feature);
    if(f && f.properties) return f.properties;
    return (m.options && m.options.meta) || {};
  }
  async function applyBitingNow(){
    const data = await loadSpecies();
    const mi = month(); const hot = {};
    (data.species||[]).forEach(sp=>{
      const h = sp.monthsHeat && sp.monthsHeat[mi] || 0;
      if(h>=2){ (sp.regions||[]).forEach(r=>{ (hot[r]=hot[r]||new Set()).add(sp.commonName); }); }
    });
    eachMarker(m=>{
      const p = props(m);
      const reg = p.region || 'Other';
      const ts = (p.targetSpecies||[]).map(s=>s.trim());
      const ok = ts.some(s => (hot[reg]||new Set()).has(s));
      if(m._icon) m._icon.style.display = ok ? '' : 'none';
      if(m._shadow) m._shadow.style.display = ok ? '' : 'none';
    });
  }
  function applySpecies(name){
    if(!name){ resetAll(); return; }
    eachMarker(m=>{
      const p = props(m);
      const ts = (p.targetSpecies||[]).map(s=>s.trim());
      const ok = ts.includes(name);
      if(m._icon) m._icon.style.display = ok ? '' : 'none';
      if(m._shadow) m._shadow.style.display = ok ? '' : 'none';
    });
  }
  function resetAll(){
    eachMarker(m=>{
      if(m._icon) m._icon.style.display='';
      if(m._shadow) m._shadow.style.display='';
    });
  }
  UIFilters.mount = async function(map){
    MAP = map;
    const bar = buildBar();
    (map.getContainer()||document.body).appendChild(bar);
    await populate();
  };
  global.UIFilters = UIFilters;
})(window);
