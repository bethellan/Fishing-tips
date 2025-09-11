(function(global){
  const AppPatch = {};
  let SPECIES = null;
  let MAP = null;
  let LAST_POPUP = null;

  async function loadSpeciesIndex(){
    const url = (global.APP_CONFIG && global.APP_CONFIG.speciesIndexUrl) || 'data/species_wlg_kapiti.json';
    const res = await fetch(url);
    SPECIES = await res.json();
    return SPECIES;
  }

  function regionFromLatLng(lat,lng){
    if(lat < -41.21 && lat > -41.37 && lng > 174.70 && lng < 174.92) return 'Wellington Harbour';
    if(lat < -41.27 && lat > -41.36 && lng > 174.77 && lng < 174.90) return 'South Coast (Miramar–Seatoun)';
    if(lat < -40.55 && lat > -41.20 && lng > 174.80 && lng < 175.10) return 'Kapiti Coast';
    if(lat < -40.23 && lat > -40.80 && lng > 175.00 && lng < 175.35) return 'West Coast (Foxton–Ōtaki)';
    return 'Other';
  }

  function suggestSpeciesForRegion(region, monthIndex){
    if(!SPECIES) return [];
    const out = [];
    (SPECIES.species || []).forEach(sp => {
      if(sp.regions.includes(region)){
        const heat = sp.monthsHeat[monthIndex] || 0;
        if(heat > 0){
          out.push({
            name: sp.commonName,
            heat,
            tide: sp.tideBest || [],
            times: sp.times || [],
            rigs: sp.topRigs || [],
            baits: sp.topBaits || []
          });
        }
      }
    });
    out.sort((a,b)=> (b.heat - a.heat));
    return out;
  }

  async function reverseGeocode(lat,lng){
    try{
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }catch(e){
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  function uuid(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }
  function ensureLS(key){
    if(!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
    return JSON.parse(localStorage.getItem(key));
  }
  function saveLS(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }

  async function openAddModal(latlng){
    const modal = document.getElementById('addSpotModal');
    if(!modal) return alert('Add modal HTML missing.');
    const label = document.getElementById('addSpotLocationLabel');
    const regionSel = document.getElementById('entryRegion');
    const nameInput = document.getElementById('entryName');
    const speciesInput = document.getElementById('entrySpecies');
    const tideInput = document.getElementById('entryTide');
    const timesInput = document.getElementById('entryTimes');
    const rigsInput = document.getElementById('entryRigs');
    const baitsInput = document.getElementById('entryBaits');
    const notesInput = document.getElementById('entryNotes');
    const typeSel = document.getElementById('entryType');

    label.textContent = 'Looking up location...';
    document.getElementById('addSpotModal').style.display = 'block';

    const display = await reverseGeocode(latlng.lat, latlng.lng);
    label.textContent = display;

    const region = regionFromLatLng(latlng.lat, latlng.lng);
    regionSel.value = region;
    const monthIdx = (new Date()).getMonth();
    if(!SPECIES) await loadSpeciesIndex();
    const sugg = suggestSpeciesForRegion(region, monthIdx);
    if(sugg.length){
      const top = sugg.slice(0, 6);
      speciesInput.value = top.map(s => s.name).join(', ');
      tideInput.value = Array.from(new Set(top.flatMap(s=>s.tide))).slice(0,3).join(', ');
      timesInput.value = Array.from(new Set(top.flatMap(s=>s.times))).slice(0,3).join(', ');
      rigsInput.value = Array.from(new Set(top.flatMap(s=>s.rigs))).slice(0,3).join(', ');
      baitsInput.value = Array.from(new Set(top.flatMap(s=>s.baits))).slice(0,3).join(', ');
      notesInput.value = `Auto-suggested by region/month. Refine as needed.`;
    }else{
      speciesInput.value = tideInput.value = timesInput.value = rigsInput.value = baitsInput.value = notesInput.value = '';
    }

    document.getElementById('saveEntryBtn').onclick = () => saveEntry(latlng);
  }

  function saveEntry(latlng){
    const typeSel = document.getElementById('entryType');
    const regionSel = document.getElementById('entryRegion');
    const nameInput = document.getElementById('entryName');
    const nowISO = new Date().toISOString();

    if(typeSel.value === 'spot'){
      const speciesInput = document.getElementById('entrySpecies');
      const tideInput = document.getElementById('entryTide');
      const timesInput = document.getElementById('entryTimes');
      const rigsInput = document.getElementById('entryRigs');
      const baitsInput = document.getElementById('entryBaits');
      const notesInput = document.getElementById('entryNotes');

      const obj = {
        id: uuid(), type:'spot', name: nameInput.value || 'New Spot',
        lat: latlng.lat, lng: latlng.lng, region: regionSel.value,
        targetSpecies: speciesInput.value.split(',').map(s=>s.trim()).filter(Boolean),
        bestTide: tideInput.value.split(',').map(s=>s.trim()).filter(Boolean),
        bestTimes: timesInput.value.split(',').map(s=>s.trim()).filter(Boolean),
        recommendedRigs: rigsInput.value.split(',').map(s=>s.trim()).filter(Boolean),
        bestBaits: baitsInput.value.split(',').map(s=>s.trim()).filter(Boolean),
        notes: notesInput.value.trim(),
        createdAt: nowISO, updatedAt: nowISO
      };
      const list = ensureLS('new_spots'); list.push(obj); saveLS('new_spots', list);
      addMarker(obj);
    } else {
      const cat = document.getElementById('amenityCategory').value;
      const notes = document.getElementById('amenityNotes').value.trim();
      const obj = {
        id: uuid(), type:'amenity', name: nameInput.value || 'Amenity',
        lat: latlng.lat, lng: latlng.lng, region: regionSel.value,
        amenityCategory: cat, notes, createdAt: nowISO, updatedAt: nowISO
      };
      const list = ensureLS('new_amenities'); list.push(obj); saveLS('new_amenities', list);
      addMarker(obj);
    }
    document.getElementById('addSpotModal').style.display = 'none';
  }

  function addMarker(obj){
    if(!MAP) return;
    const marker = L.marker([obj.lat, obj.lng], { meta: obj, title: obj.name });
    const html = (obj.type === 'spot')
      ? `<strong>${obj.name}</strong><br>${obj.region}<br><em>${(obj.targetSpecies||[]).join(', ')}</em><br>${obj.notes||''}`
      : `<strong>${obj.name}</strong><br>${obj.region}<br>${obj.amenityCategory||'amenity'}<br>${obj.notes||''}`;
    marker.bindPopup(html);
    marker.addTo(window.SPOTS_LAYER || MAP);
    marker.on('popupopen', () => {
      if(LAST_POPUP && LAST_POPUP !== marker.getPopup()){ LAST_POPUP._close(); }
      LAST_POPUP = marker.getPopup();
    });
  }

  function download(filename, text){
    const el = document.createElement('a');
    el.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(text);
    el.download = filename; el.style.display='none';
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
  }
  AppPatch.exportPendingData = () => {
    const spots = JSON.parse(localStorage.getItem('new_spots')||'[]');
    const amenities = JSON.parse(localStorage.getItem('new_amenities')||'[]');
    download('new_spots.json', JSON.stringify(spots, null, 2));
    download('new_amenities.json', JSON.stringify(amenities, null, 2));
  };

  AppPatch.enableSinglePopupMode = (map) => {
    MAP = map;
    map.on('popupopen', (e) => {
      const p = e.popup;
      if(LAST_POPUP && LAST_POPUP !== p){ LAST_POPUP._close(); }
      LAST_POPUP = p;
    });
  };

  AppPatch.enableQuickAdd = async (map) => {
    MAP = map;
    if(!SPECIES) await loadSpeciesIndex();
    map.on('contextmenu', (ev) => openAddModal(ev.latlng));
  };

  global.AppPatch = AppPatch;
})(window);
