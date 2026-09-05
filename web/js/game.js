import { dict, getLang, onLang } from './i18n.js';
import { invoke, listen, hasCore, currentWindow } from './tauri.js';
import * as ov from './overlay.js';

let gameMode = 'ready', gameVer = null, gameUpdVer = null, gameBusy = false, gameNoManifest = false;
let dlState = 'idle';

function displayState(){
  if(dlState==='downloading') return 'downloading';
  if(dlState==='paused') return 'paused';
  if(gameMode==='missing') return 'missing';
  if(gameMode==='corrupt') return 'corrupt';
  if(gameUpdVer || gameNoManifest) return 'update';
  return 'ready';
}

function setStatus(){
  const d=dict(), gs=document.getElementById('gamestate'), mk=document.getElementById('smark');
  const s=displayState();
  let txt=d.ready, warn=false;
  if(s==='missing'){ txt=d.st_missing; warn=true; }
  else if(s==='corrupt'){ txt=d.st_repair; warn=true; }
  else if(s==='update'){ txt = gameUpdVer ? ('→ v'+gameUpdVer) : d.st_update; }
  if(gs) gs.textContent=txt;
  if(mk) mk.classList.toggle('warn', warn);
}

function refreshPlayLabel(){
  const d=dict(), el=document.querySelector('#play .playlbl'), btn=document.getElementById('play');
  const s=displayState();
  let label = d.play;
  if(s==='downloading') label=d.pause;
  else if(s==='paused') label=d.resume;
  else if(s==='missing') label=d.play_install;
  else if(s==='corrupt') label=d.play_repair;
  else if(s==='update') label=d.play_update;
  if(el) el.textContent=label;
  if(btn){ btn.classList.toggle('dl', s==='downloading'); btn.classList.toggle('up', s==='update'); }
}

function refreshGameUI(){
  const d=dict();
  refreshPlayLabel();
  if(dlState==='idle') setStatus();
  const ver=document.getElementById('gamever');
  if(ver) ver.textContent = gameVer ? ('v'+gameVer) : d.g_missing;
  const chip=document.getElementById('gameupd');
  if(chip){
    if(gameUpdVer){ const v=chip.querySelector('.gu-v'); if(v) v.textContent='v'+gameUpdVer; chip.hidden=false; }
    else chip.hidden=true;
  }
}

export function setGameMode(m){ gameMode=m; refreshGameUI(); }

function showProgress(on){
  const st=document.getElementById('status'), pr=document.getElementById('progress');
  if(st) st.hidden = on;
  if(pr) pr.hidden = !on;
}
function fmtSize(bytes){ const u=getLang()==='en'?' GB':' Go'; return (bytes/1073741824).toFixed(2)+u; }
function fmtSpeed(bps){
  const mb=getLang()==='en'?' MB/s':' Mo/s', kb=getLang()==='en'?' KB/s':' Ko/s';
  return bps>=1048576 ? (bps/1048576).toFixed(1)+mb : Math.max(0,Math.round(bps/1024))+kb;
}

export async function downloadGame(){
  if(gameBusy) return; gameBusy=true; dlState='downloading'; refreshGameUI();
  const d=dict();
  const fill=document.getElementById('progfill'), pctEl=document.getElementById('progpct'),
        stat=document.getElementById('progstat'), label=document.getElementById('proglabel');
  if(label) label.textContent=d.dl_progress;
  showProgress(true);
  let unlisten=null, lastB=0, lastT=performance.now(), speed=0;
  try{
    unlisten = await listen('game_dl', e=>{
      let received=0, total=0;
      if(Array.isArray(e.payload)){ received=+e.payload[0]||0; total=+e.payload[1]||0; }
      else { total=100; received=(e.payload|0); }
      const p = total>0 ? Math.min(100, Math.round(received*100/total)) : 0;
      if(fill) fill.style.width=p+'%';
      if(pctEl) pctEl.textContent=p+'%';
      const now=performance.now(), dt=(now-lastT)/1000;
      if(dt>0.35){ speed=(received-lastB)/dt; lastB=received; lastT=now; }
      if(stat && total>1024) stat.textContent = fmtSize(received)+' / '+fmtSize(total)+'  (@ '+fmtSpeed(speed)+')';
    });
    const v = await invoke('game_download');
    gameVer=v; gameUpdVer=null; gameNoManifest=false; gameMode='ready'; dlState='idle';
    if(fill) fill.style.width='100%'; if(pctEl) pctEl.textContent='100%';
    setTimeout(()=>{ showProgress(false); refreshGameUI(); }, 900);
  }catch(err){
    const msg = String(err);
    if(msg.includes('paused')){ dlState='paused'; refreshGameUI(); }
    else if(msg.includes('cancelled')){ dlState='idle'; showProgress(false); refreshGame(); }
    else { dlState='idle'; if(label) label.textContent=d.dl_err; setTimeout(()=>{ showProgress(false); refreshGameUI(); }, 3200); }
  }finally{ if(unlisten) unlisten(); gameBusy=false; }
}

export async function refreshGame(){
  if(!hasCore()){ gameMode='ready'; gameVer=null; gameUpdVer=null; gameNoManifest=false; refreshGameUI(); return; }
  try{
    const st = await invoke('game_status');
    gameVer = st.version || null;
    gameMode = st.installed ? 'ready' : 'missing';
    gameNoManifest = st.installed && !st.version;
    refreshGameUI();
  }catch(e){}
  try{
    const up = await invoke('game_check_update');
    if(gameNoManifest){
      gameUpdVer = (up && up.version) ? up.version : '';
    } else {
      if(up && !up.installed && up.available) gameMode='missing';
      gameUpdVer = (up && up.available && up.installed) ? up.version : null;
    }
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
    if(r.status==='missing'){ setGameMode('missing'); ov.hide(1500); setTimeout(downloadGame, 1600); }
    else if(r.status==='corrupt'){ setGameMode('corrupt'); ov.hide(1500); setTimeout(downloadGame, 1600); }
    else { refreshGame(); ov.hide(2200); }
  }).catch(()=>{ ov.setText(d.v_offline); ov.hide(2400); });
}

function launchGame(){
  ov.show(dict().virt);
  if(!hasCore()){ ov.hide(1900); return; }
  invoke('launch_game').then(()=>{
    const w = currentWindow();
    setTimeout(()=>{ if(w) w.close(); }, 1300);
  }).catch(e=>{ ov.setText(String(e)); ov.hide(2500); });
}

export function initGame(){
  document.getElementById('play').onclick=()=>{
    const s=displayState();
    if(s==='downloading'){ invoke('pause_download').catch(()=>{}); return; }
    if(gameBusy) return;
    if(s==='paused' || s==='missing' || s==='corrupt' || s==='update'){ downloadGame(); return; }
    launchGame();
  };
  const cancel=document.getElementById('dlcancel');
  if(cancel) cancel.onclick=()=>{
    if(hasCore()) invoke('cancel_download').catch(()=>{});
    if(dlState==='paused'){ dlState='idle'; showProgress(false); refreshGame(); }
  };
  onLang(refreshGameUI);
  refreshGame();
}
