(function(global){
  'use strict';
  let ctx = { map:null, getSpots:null, reRender:null };
  let addMode=false, editMode=false, dirty=false;

  const editBtn=document.getElementById('editBtn');
  const addBtn=document.getElementById('addBtn');
  const exportBtn=document.getElementById('exportBtn');

  function uid(){ return crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36)+Math.random().toString(36).slice(2)); }
  function markDirty(){ dirty=true; exportBtn.style.outline='2px solid #1ea672'; }
  function clearDirty(){ dirty=false; exportBtn.style.outline=''; }
  function setEdit(on){ editMode=!!on; editBtn.setAttribute('data-on', String(editMode)); global.__setMarkersDraggable && global.__setMarkersDraggable(editMode); }
  function setAdd(on){ addMode=!!on; addBtn.setAttribute('data-on', String(addMode)); }
  function isEditOn(){ return editMode; }

  function download(filename, text){
    const blob = new Blob([text], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function formHTML(lat,lng){
    const regions = (global.APP_CONFIG?.regions)||[];
    return `<div class="form">
      <div class="form-row">
        <div><label>Name</label><input id="f_name" placeholder="Spot name" required></div>
        <div><label>Region</label><select id="f_region">${regions.map(r=>`<option>${r}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div><label>Access</label><select id="f_access"><option>surf</option><option>rock</option><option>wharf</option></select></div>
        <div><label>Livebaitable</label><select id="f_live"><option>false</option><option>true</option></select></div>
      </div>
      <div class="form-row">
        <div><label>Cast min (m)</label><input id="f_castmin" type="number" value="60"></div>
        <div><label>Cast max (m)</label><input id="f_castmax" type="number" value="100"></div>
      </div>
      <div class="form-row">
        <div><label>Depth</label><input id="f_depth" value="bars/gutters"></div>
        <div><label>Substrate</label>
          <select id="f_sub" multiple>
            <option>sand</option><option>reef</option><option>rocky base</option><option>weed</option>
          </select>
        </div>
      </div>
      <div><label>Species (comma-separated)</label><input id="f_species" value="Kahawai, Gurnard, Rig (Spotted Smoothhound)"></div>
      <div><label>Hazards</label><input id="f_haz" value=""></div>
      <div class="small">Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</div>
      <div class="form-actions">
        <button id="f_cancel" type="button">Cancel</button>
        <button id="f_save" type="button">Save</button>
      </div>
    </div>`;
  }

  function openAddForm(lat,lng){
    const drawer=document.getElementById('drawer'); const content=document.getElementById('drawerContent'); const title=document.getElementById('drawerTitle');
    drawer.classList.remove('hidden'); title.textContent='Add spot';
    content.innerHTML = formHTML(lat,lng);

    content.querySelector('#f_cancel').onclick = ()=> { setAdd(false); drawer.classList.add('hidden'); };
    content.querySelector('#f_save').onclick = ()=> {
      const name = content.querySelector('#f_name').value.trim();
      const region = content.querySelector('#f_region').value;
      const access = content.querySelector('#f_access').value;
      const live = content.querySelector('#f_live').value==='true';
      const castmin = parseInt(content.querySelector('#f_castmin').value||'0',10);
      const castmax = parseInt(content.querySelector('#f_castmax').value||'0',10);
      const depth = content.querySelector('#f_depth').value.trim()||'—';
      const subs = Array.from(content.querySelector('#f_sub').selectedOptions).map(o=>o.value);
      const species = content.querySelector('#f_species').value.split(',').map(s=>s.trim()).filter(Boolean);
      const hazards = content.querySelector('#f_haz').value.trim();

      const item = {
        id: uid(), type:'spot', name, region, accessType:access, lat:+lat, lng:+lng,
        castingMinMeters:castmin, castingMaxMeters:castmax, depthEstimate:depth, substrate:subs.length?subs:['sand'],
        livebaitable:live, highYield:false, targetSpecies: species.length?species:['Kahawai','Gurnard','Rig (Spotted Smoothhound)'],
        hazards, speciesAdvice: {}
      };
      // auto-fill advice so filters & guidance always work
      global.AdviceDrawer && global.AdviceDrawer.ensureAdvice(item);
      const spots = ctx.getSpots? ctx.getSpots() : [];
      spots.push(item);
      markDirty();
      setAdd(false); drawer.classList.add('hidden');
      ctx.reRender && ctx.reRender();
    };
  }

  function onMapClick(e){ if(addMode) openAddForm(e.latlng.lat, e.latlng.lng); }

  function attach(_ctx){
    ctx = _ctx || ctx;
    if(ctx.map && !ctx._mapHooked){ ctx.map.on('click', onMapClick); ctx._mapHooked = true; }

    editBtn.onclick = ()=> setEdit(!editMode);
    addBtn.onclick  = ()=> setAdd(!addMode);
    exportBtn.onclick = ()=>{
      const spots = ctx.getSpots? ctx.getSpots() : [];
      download('spots_master.json', JSON.stringify(spots, null, 2));
      clearDirty();
    };
  }

  global.Editor = { attach, isEditOn: ()=>editMode, markDirty };
})(window);
