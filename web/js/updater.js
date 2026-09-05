import { dict, getLang, onLang } from './i18n.js';
import { invoke, hasCore, askDialog } from './tauri.js';
import * as ov from './overlay.js';

const updCheck = document.getElementById('updcheck');
const updNote = document.getElementById('updnote');
let updState = 'idle', updVersion = '';

function renderUpd(){
  const d = dict();
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

function install(){
  if(!hasCore()){ ov.show(dict().dl); ov.hide(1900); return; }
  ov.show(getLang()==='en' ? 'Downloading v'+updVersion+'…' : 'Téléchargement v'+updVersion+'…');
  invoke('install_update')
    .catch(e=>{ ov.setText((getLang()==='en'?'Update error: ':'Erreur de MAJ : ')+String(e)); ov.hide(2600); });
}

async function promptInstall(){
  const d = dict(), en = getLang()==='en';
  const msg = en
    ? 'A launcher update is available (v'+updVersion+'). Install it now? The launcher will restart.'
    : 'Une mise à jour du launcher est disponible (v'+updVersion+'). L\'installer maintenant ? Le launcher va redémarrer.';
  const ok = await askDialog(msg, { title: d.lu_title, kind: 'info', okLabel: en?'Install':'Installer', cancelLabel: en?'Later':'Plus tard' });
  if(ok) install();
}

async function checkUpdates(prompt){
  if(!hasCore()){ updState='idle'; renderUpd(); return; }
  updState='checking'; renderUpd();
  try{
    const v = await invoke('check_update');
    updVersion = v || ''; updState = v ? 'available' : 'current';
  }catch(e){ updState='idle'; }
  renderUpd();
  if(prompt && updState==='available') promptInstall();
}

export function initUpdater(){
  if(updCheck) updCheck.onclick = ()=>{
    if(updState==='available') promptInstall();
    else if(updState!=='checking') checkUpdates(true);
  };
  onLang(renderUpd);
  renderUpd();
  checkUpdates(true);
}
