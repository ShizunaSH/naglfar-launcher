import { dict, onLang } from './i18n.js';
import { invoke, listen, hasCore } from './tauri.js';
import * as ov from './overlay.js';

let gameMode = 'ready', gameVer = null, gameUpdVer = null, gameBusy = false;

function setStatus(mode){
  const d=dict(), gs=document.getElementById('gamestate'), dot=document.getElementById('sdot');
  let txt = d.ready, cls='';
  if(mode==='missing'){ txt=d.st_missing; cls='miss'; }
  else if(mode==='corrupt'){ txt=d.st_repair; cls='miss'; }
  else if(mode==='busy'){ txt=d.st_busy; cls='busy'; }
  if(gs) gs.textContent = txt;
  if(dot){ dot.classList.remove('miss','busy'); if(cls) dot.classList.add(cls); }
}

function refreshPlayLabel(){
  const d=dict(), el=document.querySelector('#play .playlbl');
  if(el) el.textContent = gameMode==='missing' ? d.play_install : gameMode==='corrupt' ? d.play_repair : d.play;
}

function refreshGameUI(){
  const d=dict();
  refreshPlayLabel();
  setStatus(gameBusy ? 'busy' : gameMode);
  const play=document.getElementById('play'); if(play) play.disabled = gameBusy;
  const ver=document.getElementById('gamever');
  if(ver) ver.textContent = gameVer ? ('v'+gameVer) : d.g_missing;
  const chip=document.getElementById('gameupd');
  if(chip){
    if(gameUpdVer){ const v=chip.querySelector('.gu-v'); if(v) v.textContent='v'+gameUpdVer; chip.hidden=false; }
    else chip.hidden=true;
  }
}

export function setGameMode(m){ gameMode=m; refreshGameUI(); }

export async function downloadGame(){
  if(gameBusy) return; gameBusy=true; refreshGameUI();
  const d=dict();
  ov.beginProgress(d.dl_game+' 0%');
  let unlisten=null;
  try{
    unlisten = await listen('game_dl', e=>{ const p=e.payload|0; ov.setProgress(p); ov.setText(d.dl_game+' '+p+'%'); });
    const v = await invoke('game_download');
    gameVer=v; gameUpdVer=null; gameMode='ready';
    ov.setProgress(100); ov.setText(d.dl_done);
    ov.hide(1400);
  }catch(err){
    ov.setText(d.dl_err+' ('+String(err)+')');
    ov.hide(3600);
  }finally{ if(unlisten) unlisten(); gameBusy=false; refreshGameUI(); }
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
    const msg = map[r.status] || String(r.status);
    ov.setText(msg);
    if(r.status==='missing'){ setGameMode('missing'); ov.hide(1600); setTimeout(downloadGame, 1700); }
    else if(r.status==='corrupt'){ setGameMode('corrupt'); ov.hide(1600); setTimeout(downloadGame, 1700); }
    else { refreshGame(); ov.hide(2200); }
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
  onLang(refreshGameUI);
  refreshGame();
}
