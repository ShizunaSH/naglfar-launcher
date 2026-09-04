import { invoke, hasCore, currentWindow } from './tauri.js';
import { runVerify } from './game.js';
import { openChangelog } from './changelog.js';

function initVersion(){
  const set=(v)=>{ const s='v'+v; const t=document.getElementById('tbver'); const b=document.getElementById('verline'); if(t)t.textContent=s; if(b)b.textContent=s; };
  if(hasCore()) invoke('app_version').then(set).catch(()=>{});
}

function initWindowControls(){
  const appWin = currentWindow();
  if(!appWin) return;
  const on=(s,f)=>{ const el=document.querySelector(s); if(el) el.onclick=f; };
  on('.wc.min',   ()=>appWin.minimize());
  on('.wc.close', ()=>appWin.close());
}

function initSidebar(){
  document.querySelectorAll('.side[data-act]').forEach(b=> b.onclick=()=>{ switch(b.dataset.act){
    case 'install': invoke('open_install_dir').catch(()=>{}); break;
    case 'saves':   invoke('open_saves_dir').catch(()=>{}); break;
    case 'verify':  runVerify(); break;
    case 'changelog': openChangelog(); break;
  }});
  document.querySelectorAll('.soc[data-url]').forEach(b=> b.onclick=()=>{
    const u=b.dataset.url;
    if(hasCore()) invoke('open_url',{url:u}).catch(()=>{}); else window.open(u,'_blank');
  });
}

export function initShell(){
  initVersion();
  initWindowControls();
  initSidebar();
}
