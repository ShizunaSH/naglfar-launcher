import { dict, onLang } from './i18n.js';
import { invoke, hasCore } from './tauri.js';
import * as ov from './overlay.js';
import { runVerify, refreshGame, downloadGame } from './game.js';

const setEl = document.getElementById('set');

function open(){ setEl.classList.add('on'); }
function close(){ setEl.classList.remove('on'); }

function selectSection(sec){
  document.querySelectorAll('.set-nav').forEach(b=>b.classList.toggle('on', b.dataset.sec===sec));
  document.querySelectorAll('.set-pane').forEach(p=>p.classList.toggle('on', p.dataset.pane===sec));
}

async function loadGameFolder(){
  const el=document.getElementById('gfpath');
  if(!el) return;
  if(!hasCore()){ el.textContent = dict().gf_none; return; }
  try{ const p = await invoke('game_folder'); el.textContent = p || dict().gf_none; }
  catch(e){ el.textContent = dict().gf_none; }
}

export function initSettings(){
  document.getElementById('gear').onclick = open;
  document.getElementById('setx').onclick = close;
  setEl.onclick = (e)=>{ if(e.target===setEl) close(); };
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && setEl.classList.contains('on')) close(); });

  document.querySelectorAll('.set-nav').forEach(b=> b.onclick=()=> selectSection(b.dataset.sec));

  document.getElementById('repair').onclick = ()=> runVerify();
  document.getElementById('ugcheck').onclick = ()=> refreshGame();
  document.getElementById('gameupd').onclick = ()=> downloadGame();
  document.getElementById('opensaves').onclick = ()=> invoke('open_saves_dir').catch(()=>{});
  document.getElementById('openinstall').onclick = ()=> invoke('open_install_dir').catch(()=>{});

  document.getElementById('gfchange').onclick = ()=>{
    invoke('change_game_folder').then(p=>{ if(p){ const el=document.getElementById('gfpath'); if(el) el.textContent=p; } refreshGame(); }).catch(()=>{});
  };

  document.getElementById('diag').onclick = ()=>{
    const d=dict();
    if(!hasCore()){ ov.show(d.dl); ov.hide(1500); return; }
    ov.show(d.diag_btn+'…');
    invoke('save_diagnostics').then(()=>{ ov.setText(d.diag_done); ov.hide(1800); }).catch(e=>{ ov.setText(String(e)); ov.hide(2400); });
  };

  onLang(loadGameFolder);
  loadGameFolder();
}
