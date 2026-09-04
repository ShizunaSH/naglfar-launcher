import { dict, getLang, onLang } from './i18n.js';
import { content } from './content.js';

let clSel = 0;
const clEl = document.getElementById('cl');

function renderChangelog(){
  const d = dict();
  const versions = content().versions || [];
  const rail = document.getElementById('clrail');
  const notes = document.getElementById('clnotes');
  if(!rail || !notes) return;
  if(clSel >= versions.length) clSel = 0;
  rail.innerHTML = '';
  notes.innerHTML = '';
  if(versions.length === 0) return;
  versions.forEach((rel, i)=>{
    const b = document.createElement('button');
    b.className = 'cl-v' + (i===clSel ? ' on' : '');
    b.innerHTML = `<span class="vn">v${rel.v}</span><span class="vd">${rel.date}</span>` +
      (rel.latest ? `<span class="vlatest">${d.cl_latest}</span>` : '');
    b.onclick = ()=>{ clSel = i; renderChangelog(); };
    rail.appendChild(b);
  });
  const rel = versions[clSel];
  const kcls = { new:'k-new', bal:'k-bal', fix:'k-fix', ui:'k-ui' };
  const klbl = { new:d.cat_new, bal:d.cat_bal, fix:d.cat_fix, ui:d.cat_ui };
  notes.innerHTML = `<h3>v${rel.v}</h3><div class="date">${rel.date}${rel.latest ? ' · '+d.cl_latest : ''}</div>` +
    (rel.notes||[]).map(n=>`<div class="cl-item"><span class="k ${kcls[n.k]||'k-ui'}">${klbl[n.k]||''}</span>`+
      `<span class="tx">${getLang()==='en'?n.en:n.fr}</span></div>`).join('');
  notes.scrollTop = 0;
}

export function openChangelog(){ clSel = 0; renderChangelog(); clEl.classList.add('on'); }
function closeChangelog(){ clEl.classList.remove('on'); }

export function initChangelog(){
  document.getElementById('clx').onclick = closeChangelog;
  clEl.onclick = (e)=>{ if(e.target === clEl) closeChangelog(); };
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && clEl.classList.contains('on')) closeChangelog(); });
  onLang(renderChangelog);
}
