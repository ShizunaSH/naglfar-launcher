import { dict, getLang, onLang } from './i18n.js';
import { invoke, listen, hasCore } from './tauri.js';
import * as ov from './overlay.js';

let gameMode = 'ready', gameVer = null, gameUpdVer = null, gameBusy = false;

function refreshPlayLabel(){
  const d=dict(), el=document.querySelector('#play .playlbl');
  if(el) el.textContent = gameMode==='missing' ? d.play_install : gameMode==='corrupt' ? d.play_repair : d.play;
}

function refreshGameUI(){
  const d=dict();
  refreshPlayLabel();
  const chip=document.getElementById('gameupd');
  if(chip){
    if(gameUpdVer){ chip.querySelector('.gu-txt').textContent='v'+gameUpdVer; chip.hidden=false; }
    else chip.hidden=true;
  }
  const gs=document.getElementById('gamestate');
  if(gs) gs.textContent = gameMode==='missing' ? d.g_missing : gameVer ? (d.g_ready+' v'+gameVer+' ✓') : '';
}

export function setGameMode(m){ gameMode=m; refreshGameUI(); }

async function downloadGame(){
  if(gameBusy) return; gameBusy=true;
  const d=dict();
  ov.beginProgress(d.dl_game+' 0%');
  let unlisten=null;
  try{
    unlisten = await listen('game_dl', e=>{ const p=e.payload|0; ov.setProgress(p); ov.setText(d.dl_game+' '+p+'%'); });
    const v = await invoke('game_download');
    gameVer=v; gameUpdVer=null; setGameMode('ready');
    ov.setProgress(100); ov.setText(d.dl_done);
    ov.hide(1400);
  }catch(err){
    ov.setText(d.dl_err+' ('+String(err)+')');
    ov.hide(3600);
  }finally{ if(unlisten) unlisten(); gameBusy=false; }
}

export async function refreshGame(){
  if(!hasCore()){ gameMode='ready'; gameVer=null; gameUpdVer=null; refreshGameUI(); return; }
  try{
    const st = await invoke('game_status');
    gameVer = st.version || null;
    gameMode = st.installed ? 'ready' : 'missing';
    refreshGameUI();
  }catch(e){}
  try{
    const up = await invoke('game_check_update');
    if(up && !up.installed) gameMode='missing';
    gameUpdVer = (up && up.available && up.installed) ? up.version : null;
    refreshGameUI();
  }catch(e){}
}

export function runVerify(){
  const d = dict();
  ov.show(d.v_run);
  invoke('verify_files').then(r=>{
    const map = { ok:d.v_ok, unverified:d.v_unverified, missing:d.v_missing, corrupt:d.v_corrupt };
    let msg = map[r.status] || String(r.status);
    const bad = (r.status==='missing' || r.status==='corrupt');
    if(r.status==='missing') setGameMode('missing');
    else if(r.status==='corrupt') setGameMode('corrupt');
    else refreshGame();
    ov.setText(msg);
    ov.hide(bad ? 4600 : 2200);
  }).catch(()=>{ ov.setText(d.v_offline); ov.hide(2400); });
}

export function initGame(){
  document.getElementById('play').onclick=()=>{
    if(gameBusy) return;
    if(gameMode==='missing' || gameMode==='corrupt'){ downloadGame(); return; }
    ov.show(dict().virt);
    if(hasCore()) invoke('launch_game').catch(e=>{ ov.setText(String(e)); });
    ov.hide(1900);
  };
  document.getElementById('gameupd').onclick=()=>{ if(!gameBusy) downloadGame(); };
  onLang(refreshGameUI);
  refreshGame();
}
