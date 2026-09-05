import { dict, getLang, onLang } from './i18n.js';
import { invoke, hasCore } from './tauri.js';
import * as ov from './overlay.js';

const updPill = document.getElementById('upd');
const updPillV = updPill ? updPill.querySelector('.lupd-v') : null;
const updCheck = document.getElementById('updcheck');
const updNote = document.getElementById('updnote');
let updState = 'idle', updVersion = '';

function renderUpd(){
  const d = dict();
  if(updPill) updPill.hidden = updState!=='available';
  if(updPillV) updPillV.textContent = updVersion ? ('→ v'+updVersion) : '';
  if(updNote){
    updNote.textContent = updState==='available' ? (d.update + (updVersion?' → v'+updVersion:'')) :
                          updState==='current'   ? d.uptodate :
                          updState==='checking'  ? d.checking : '';
  }
  if(updCheck){
    updCheck.disabled = updState==='checking';
    updCheck.textContent = updState==='available' ? (d.update + (updVersion?' → v'+updVersion:'')) : d.lu_btn;
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

function install(){
  if(!hasCore()){ ov.show(dict().dl); ov.hide(1900); return; }
  ov.show(getLang()==='en' ? 'Downloading v'+updVersion+'…' : 'Téléchargement v'+updVersion+'…');
  invoke('install_update')
    .catch(e=>{ ov.setText((getLang()==='en'?'Update error: ':'Erreur de MAJ : ')+String(e)); ov.hide(2600); });
}

export function initUpdater(){
  if(updPill) updPill.onclick = ()=> install();
  if(updCheck) updCheck.onclick = ()=>{ if(updState==='available') install(); else if(updState!=='checking') checkUpdates(); };
  onLang(renderUpd);
  renderUpd();
  checkUpdates();
}
