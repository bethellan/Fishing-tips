(function(global){
  const RigHelper = {};
  let MAP=null;

  function open(){ document.getElementById('rigHelperModal').style.display='block'; }
  function close(){ document.getElementById('rigHelperModal').style.display='none'; }

  function recommend(){
    const val = id => document.getElementById(id).value;
    const mlType = val('rh_mainlineType');
    const mlLb = parseInt(val('rh_mainlineLb'),10);
    const ldLb = parseInt(val('rh_leaderLb'),10);
    const shock = val('rh_shock')==='yes';
    const rodFt = parseFloat(val('rh_rodFt'));
    const cast = val('rh_cast');
    const sp = val('rh_species');
    const live = val('rh_livebait')==='yes';

    let rig='running', trace='60–90 cm', hook='3/0–5/0 circle', knots=['Uni/Clinch','Snell (if livebait)','FG or RP (braid→leader)'], notes=[];

    const S = sp;
    if(S==='Tarakihi'){ rig='ledger (2-drop)'; trace='2 × 30–40 cm'; hook='#1–2 recurve'; notes.push('Small hooks & baits; gentle lift bites.'); }
    if(S==='Blue Moki'){ rig='ledger (long)'; trace='2 × 60–80 cm'; hook='#1–2 recurve'; notes.push('Crab/prawn at night along weedlines.'); }
    if(S==='Gurnard'){ rig='ledger'; trace='2 × 40–60 cm'; hook='#2–3 recurve'; notes.push('Clean sand; sit the bait on bottom.'); }
    if(S==='Kahawai'){
      if(live){ rig='sliding livebait'; trace='1.2–1.8 m (60–80 lb head)'; hook='5/0–6/0 livebait circle'; notes.push('Stopper knot + clip; send livey down.'); }
      else { rig='running OR metal lure'; trace='60–90 cm'; hook='3/0–5/0'; notes.push('Spinners at dawn/evening; current lines.'); }
    }
    if(S==='Yellowtail Kingfish'){ rig = live ? 'balloon/sliding livebait' : 'stickbait/metal'; trace='1.5–2.0 m (80–100 lb)'; hook='7/0–9/0 livebait circle'; notes.push('Strong drag; avoid pylons; piper/macks.'); }
    if(S==='Rig (Spotted Smoothhound)'){ rig='running/pulley'; trace='80–100 cm'; hook='3/0–5/0 circle'; notes.push('Fresh crab; spring nights incoming/high.'); }
    if(S==='School Shark (Tope)'){ rig='pulley'; trace='80–120 cm'; hook='5/0–8/0 circle (short wire optional)'; notes.push('Fresh kahawai/mackerel; abrasion resist.'); }
    if(S==='John Dory'){ rig='float OR running with small livebait'; trace='80–120 cm'; hook='3/0–5/0 livebait'; notes.push('Ambush near structure; keep livey lively.'); }
    if(S==='Snapper'){ rig='running/strayline'; trace='60–120 cm'; hook='5/0–7/0 circle'; notes.push('Pilchard/mullet; dusk/dawn; light sinker.'); }

    if(mlType==='braid'){ notes.push('Use fluoro leader for stealth/abrasion.'); knots=['FG or RP (braid→leader)','Uni/Clinch to hook','Snell for livebait']; }
    else { notes.push('Mono mainline: more shock-absorbent for casting.'); knots=['Double Uni or Albright (mono→leader)','Uni/Clinch','Snell for livebait']; }

    if(shock or cast==='OH' or cast==='OTG'){ notes.push('Use shockleader ~10× sinker weight (oz) in lb, or 60–80 lb for heavy casts.'); }
    if(rodFt>=14){ notes.push('Long surf rod: pulley/ledger for distance; sliding for livebaits when current allows.'); }

    const out = [
      `Rig: ${rig}`,
      `Trace length: ${trace}`,
      `Hook: ${hook}`,
      `Knots: ${knots.join(' • ')}`,
      `Line: ${mlLb} lb ${mlType} → ${ldLb} lb leader`,
      `Notes: ${notes.join(' | ')}`
    ].join('\\n');

    document.getElementById('rh_result').textContent = out;
  }

  RigHelper.attach = function(map){
    MAP = map;
    const mount = () => {
      const fab = document.getElementById('rigHelperFab');
      const closeBtn = document.getElementById('rigHelperCloseBtn');
      const calc = document.getElementById('rh_calcBtn');
      if(fab && closeBtn && calc){
        fab.onclick = open; closeBtn.onclick = close; calc.onclick = recommend;
      }else{
        setTimeout(mount, 100);
      }
    };
    mount();
  };

  RigHelper.open = function(){ open(); };
  global.RigHelper = RigHelper;
})(window);
