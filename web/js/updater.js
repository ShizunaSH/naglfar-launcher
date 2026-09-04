import { dict, getLang, onLang } from './i18n.js';
import { invoke, hasCore } from './tauri.js';
import * as ov from './overlay.js';

const updBtn = document.getElementById('upd');
const updLabel = updBtn.querySelector('[data-i18n="update"]');
const updSmall = updBtn.querySelector('small');
const gearDot = document.querySelector('.gear-dot');
let updState = 'idle', updVersion = '';

function renderUpd(){
  const d = dict();
  const off = (updState==='current' || updState==='checking');
  updBtn.classList.toggle('updavail', updState==='available');
  updBtn.disabled = off;
  if(gearDot) gearDot.hidden = updState!=='available';
  if(updState==='available'){
    updLabel.textContent = d.update;
    updSmall.textContent = updVersion ? ('→ v'+updVersion) : '';
    updSmall.style.display = updVersion ? '' : 'none';
  } else if(updState==='current'){
    updLabel.textContent = d.uptodate; updSmall.style.display='none';
  } else if(updState==='checking'){
    updLabel.textContent = d.checking; updSmall.style.display='none';
  } else {
    updLabel.textContent = d.update; updSmall.textContent=''; updSmall.style.display='none';
  }
}

async function checkUpdates(){
  if(!hasCore()){ updState='idle'; renderUpd(); return; }
  updState='checking'; renderUpd();
  try{
    const v = await invoke('check_update');
    updVersion = v || ''; updState = v ? 'available' : 'current';
  }catch(e){ updState='idle'; }
  renderUpd();
}

export function initUpdater(){
  updBtn.onclick = ()=>{
    if(updState==='current' || updState==='checking') return;
    if(!hasCore()){ ov.show(dict().dl); ov.hide(1900); return; }
    if(updState!=='available'){ checkUpdates(); return; }
    ov.show(getLang()==='en'?'Downloading v'+updVersion+'…':'Téléchargement v'+updVersion+'…');
    invoke('install_update')
      .catch(e=>{ ov.setText((getLang()==='en'?'Update error: ':'Erreur de MAJ : ')+String(e)); ov.hide(2600); });
  };
  onLang(renderUpd);
  renderUpd();
  checkUpdates();
}
