import { invoke, hasCore, currentWindow } from './tauri.js';

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

function initSocials(){
  document.querySelectorAll('.soc[data-url]').forEach(b=> b.onclick=()=>{
    const u=b.dataset.url;
    if(hasCore()) invoke('open_url',{url:u}).catch(()=>{}); else window.open(u,'_blank');
  });
}

export function initShell(){
  initVersion();
  initWindowControls();
  initSocials();
}
