(function(){
  // Basic Leaflet init + data load + single-popup mode (Option 3)
  const cfg = window.APP_CONFIG || {};
  const map = L.map('map', { zoomControl: true }).setView([-41.31, 174.83], 12);

  // Tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Mount partials
  fetch('partials/add_spot_modal.html').then(r=>r.text()).then(html=>{
    document.getElementById('partials-add-spot').innerHTML = html;
  });
  fetch('partials/rig_helper.html').then(r=>r.text()).then(html=>{
    document.getElementById('partials-rig-helper').innerHTML = html;
  });

  // Single-popup mode: ensure only one open at a time
  let lastPopup = null;
  map.on('popupopen', e => {
    const p = e.popup;
    if(lastPopup && lastPopup !== p){ try{ lastPopup._close(); }catch(_){} }
    lastPopup = p;
  });

  // Load spots layer
  window.SPOTS_LAYER = L.layerGroup().addTo(map);

  async function loadSpots(){
    const url = cfg.spotsUrl || 'data/spots_wellington_miramar.json';
    const res = await fetch(url);
    const arr = await res.json();
    arr.forEach(obj => {
      if(obj.type !== 'spot') return;
      const marker = L.marker([obj.lat, obj.lng], { meta: obj, title: obj.name });
      const html = `<strong>${obj.name}</strong><br>${obj.region}<br><em>${(obj.targetSpecies||[]).join(', ')}</em><br>${obj.notes||''}`;
      marker.bindPopup(html);
      marker.addTo(window.SPOTS_LAYER);
    });
  }

  loadSpots().then(() => {
    if(window.AppPatch){
      AppPatch.enableSinglePopupMode(map); // Option 3
      AppPatch.enableQuickAdd(map);        // Options 1 & 2 (Drop-a-Pin + Amenities)
    }
    if(window.UIFilters){
      UIFilters.mount(map, { spotsLayer: window.SPOTS_LAYER }); // Options 4 & 5
    }
    if(window.RigHelper){
      // Rig FAB becomes active after its partial is in DOM
      const ready = () => {
        const fab = document.getElementById('rigHelperFab');
        if(fab){ RigHelper.attach(map); } else { setTimeout(ready, 100); }
      };
      ready(); // Option 6
    }
  });
})();