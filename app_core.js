(function(){
  const cfg = window.APP_CONFIG || {};
  const RGN = ["All regions"].concat(cfg.regions||[]);
  const MONTHS = ["All months","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const map = L.map('map', { zoomControl: true }).setView([-41.31, 174.82], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

  const regionSel = document.getElementById('regionSelect');
  const accessSel = document.getElementById('accessSelect');
  const speciesSel = document.getElementById('speciesSelect');
  const monthSel = document.getElementById('monthSelect');
  const bitingBtn = document.getElementById('bitingBtn');
  const livebaitBtn = document.getElementById('livebaitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const hotspotsBtn = document.getElementById('hotspotsBtn');

  RGN.forEach(r => { const o=document.createElement('option'); o.value=r; o.textContent=r; regionSel.appendChild(o); });
  MONTHS.forEach((m,i) => { const o=document.createElement('option'); o.value=i-1; o.textContent=m; monthSel.appendChild(o); });
  monthSel.value = "-1";

  const spotsLayer = L.layerGroup().addTo(map);
  const markerIndex = new Map(); // id -> marker
  let SPOTS = [], SPECIES = {};

  function distanceBadge(s){
    if(s.castingMinMeters && s.castingMaxMeters){ return `<span class="badge">${s.castingMinMeters}–${s.castingMaxMeters} m</span>`; }
    return '';
  }
  function popupHTML(s){
    const live = s.livebaitable ? '<span class="badge">Livebaitable</span>' : '';
    const hy = s.highYield ? '<span class="badge gold">⭐ High yield</span>' : '';
    const cast = distanceBadge(s);
    const access = `<span class="badge">${(s.accessType||'surf').toUpperCase()}</span>`;
    const subs = (s.substrate||[]).join(', ') || '—';
    const depth = s.depthEstimate || '—';
    const species = (s.targetSpecies||[]).join(', ') || '—';
    return `<div><strong>${s.name}</strong><br>${s.region}<div class="rule"></div>
      ${access} ${cast} ${hy} ${live}
      <div class="small" style="margin-top:6px;">Substrate: ${subs} • Depth: ${depth}</div>
      <div class="small">Species: ${species}</div>
      <div class="rule"></div>
      <button class="popup-btn" data-action="advice">Spot advice</button>
      <button class="popup-btn" data-action="conditions">View conditions</button>
      <button class="popup-btn" data-action="close">Close</button>
    </div>`;
  }

  function makeMarker(s){
    const m = L.marker([s.lat, s.lng], { title: s.name, draggable: (window.Editor && window.Editor.isEditOn()) });
    m.bindPopup(popupHTML(s));
    m.on('popupopen', ()=>{
      const el = m.getPopup().getElement(); if(!el) return;
      el.querySelectorAll('.popup-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const a = btn.getAttribute('data-action');
          if(a==='advice'){ window.AdviceDrawer && window.AdviceDrawer.openFor(s); }
          else if(a==='conditions'){ window.ConditionsDrawer && window.ConditionsDrawer.openFor(s.lat,s.lng,s.name); }
          else if(a==='close'){ m.closePopup(); }
        });
      });
    });
    m.on('dragend', ()=>{
      if(!(window.Editor && window.Editor.isEditOn())){ m.setLatLng([s.lat, s.lng]); return; }
      const p = m.getLatLng(); s.lat=+p.lat; s.lng=+p.lng; m.setPopupContent(popupHTML(s));
      window.Editor && window.Editor.markDirty();
    });
    return m;
  }

  function setMarkersDraggable(on){
    markerIndex.forEach((m,id)=>{
      if(on){ m.dragging && m.dragging.enable(); }
      else { m.dragging && m.dragging.disable(); }
    });
  }
  window.__setMarkersDraggable = setMarkersDraggable; // used by Editor

  function filterSpots(){
    const regionVal = regionSel.value || 'All regions';
    const accessVal = accessSel.value || '';
    const speciesVal = speciesSel.value || '';
    const monthVal = parseInt(monthSel.value,10);
    const livebaitOnly = (livebaitBtn.getAttribute('data-on')==='true');

    let arr = SPOTS.slice();
    if(regionVal !== 'All regions'){ arr = arr.filter(s => s.region === regionVal); }
    if(accessVal){ arr = arr.filter(s => (s.accessType||'surf') === accessVal); }
    if(speciesVal){ arr = arr.filter(s => (s.targetSpecies||[]).includes(speciesVal)); }
    if(livebaitOnly){ arr = arr.filter(s => !!s.livebaitable); }
    if(!Number.isNaN(monthVal) && monthVal>=0){
      arr = arr.filter(s => {
        const adv = s.speciesAdvice||{}; const keys = Object.keys(adv);
        if(keys.length===0) return true;
        return keys.some(k => ((adv[k].monthHeat||[])[monthVal]||0) >= 1);
      });
    }
    return arr;
  }

  function renderMarkers(opts={}){
    spotsLayer.clearLayers(); markerIndex.clear();
    const arr = filterSpots();
    arr.forEach(s=>{
      // make sure advice exists so popups always have guidance
      window.AdviceDrawer && window.AdviceDrawer.ensureAdvice(s);
      const m = makeMarker(s); m.addTo(spotsLayer); markerIndex.set(s.id, m);
    });
    if(arr.length && !opts.noPan){ map.panTo([arr[0].lat, arr[0].lng]); }
    window.__SPOTS__ = SPOTS;
    window.__focusOn = (lat,lng)=>{
      map.setView([lat,lng], 14);
      let best=null, bd=1e9;
      markerIndex.forEach((marker, id)=>{
        const s = SPOTS.find(x=>x.id===id); if(!s) return;
        const d = Math.hypot(s.lat-lat, s.lng-lng); if(d<bd){ bd=d; best=marker; }
      });
      best && best.openPopup();
    };
  }

  function populateSpeciesList(specObj){
    const names = Array.from(new Set((specObj.species||[]).map(x=>x.commonName))).sort();
    speciesSel.innerHTML = '<option value="">All species</option>';
    names.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; speciesSel.appendChild(o); });
  }

  [regionSel, accessSel, speciesSel, monthSel].forEach(el => el.addEventListener('change', () => renderMarkers({noPan:true})));
  bitingBtn.addEventListener('click', () => {
    const on = bitingBtn.getAttribute('data-on')==='true';
    bitingBtn.setAttribute('data-on', String(!on));
    monthSel.value = (!on) ? String((new Date()).getMonth()) : "-1";
    renderMarkers({noPan:true});
  });
  livebaitBtn.addEventListener('click', () => {
    const on = livebaitBtn.getAttribute('data-on')==='true';
    livebaitBtn.setAttribute('data-on', String(!on));
    renderMarkers({noPan:true});
  });
  hotspotsBtn.addEventListener('click', () => {
    const on = hotspotsBtn.getAttribute('data-on')==='true';
    if(on){
      hotspotsBtn.setAttribute('data-on','false');
      const d=document.getElementById('drawer'); d&&d.classList.add('hidden'); document.getElementById('drawerContent').innerHTML='';
      return;
    }
    hotspotsBtn.setAttribute('data-on','true');
    window.HotSpots && window.HotSpots.trigger && window.HotSpots.trigger();
  });
  resetBtn.addEventListener('click', () => {
    regionSel.value='All regions'; accessSel.value=''; speciesSel.value=''; monthSel.value='-1';
    bitingBtn.setAttribute('data-on','false'); livebaitBtn.setAttribute('data-on','false'); hotspotsBtn.setAttribute('data-on','false');
    const d=document.getElementById('drawer'); d&&d.classList.add('hidden');
    renderMarkers();
  });

  Promise.all([fetch(cfg.spotsUrl).then(r=>r.json()), fetch(cfg.speciesUrl).then(r=>r.json())])
    .then(([spots, spec]) => {
      SPOTS = Array.isArray(spots) ? spots : [];
      SPECIES = spec || {};
      populateSpeciesList(SPECIES);
      renderMarkers();
      window.HotSpots && window.HotSpots.init({map, getSpots: ()=>filterSpots(), topN:5});
      window.Editor && window.Editor.attach({ map, getSpots: ()=>SPOTS, reRender: ()=>renderMarkers({noPan:true}) });
    });
})();
