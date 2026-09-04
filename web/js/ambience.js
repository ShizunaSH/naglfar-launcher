import { getLang, onLang } from './i18n.js';
import { content } from './content.js';

const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

function newsLines(){
  const versions = content().versions || [];
  const rel = versions.find(v=>v.latest) || versions[0];
  if(!rel || !rel.notes || rel.notes.length === 0) return [["", ""]];
  return rel.notes.map(n=>["v"+rel.v+" — ", getLang()==='en' ? (n.en||n.fr||'') : (n.fr||n.en||'')]);
}

export function initParticles(){
  const cv = document.getElementById('scene'), ctx = cv.getContext('2d');
  let W, H, dpr, parts = [];

  function buildParticles(){ const n=Math.max(40, Math.round((W*H)/(28000*dpr))); parts=[];
    for(let i=0;i<n;i++) parts.push({ x:Math.random()*W, y:Math.random()*H, r:(Math.random()*1.7+0.6)*dpr,
      vy:-(Math.random()*0.18+0.05)*dpr, vx:(Math.random()-0.5)*0.05*dpr, a:Math.random()*0.5+0.28, tw:Math.random()*Math.PI*2 }); }
  function resize(){ dpr=Math.min(devicePixelRatio||1,2); const r=cv.getBoundingClientRect();
    W=cv.width=r.width*dpr; H=cv.height=r.height*dpr; buildParticles(); }
  new ResizeObserver(resize).observe(cv); resize();

  function frame(){
    ctx.clearRect(0,0,W,H);
    for(const p of parts){
      if(!reduce){ p.y+=p.vy; p.x+=p.vx; p.tw+=0.018;
        if(p.y<-6){ p.y=H+6; p.x=Math.random()*W; } if(p.x<-6) p.x=W+6; else if(p.x>W+6) p.x=-6; }
      const a=p.a*(0.6+0.4*Math.sin(p.tw));
      ctx.fillStyle=`rgba(165,205,250,${a})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function initGlitch(){
  const g1=document.getElementById('g1');
  if(!g1 || reduce) return;
  setInterval(()=>{ g1.classList.remove('go'); void g1.offsetWidth; g1.classList.add('go'); }, 5000);
}

export function initNews(){
  const logEl=document.getElementById('log');
  let li=0, ci=0, lines=newsLines();
  function typ(){ const [tag,txt]=lines[li];
    if(ci<=txt.length){ logEl.innerHTML=`<span class="t">${tag}</span>${txt.slice(0,ci)}`; ci++; setTimeout(typ, reduce?0:18); }
    else setTimeout(()=>{ li=(li+1)%lines.length; ci=0; typ(); }, 2600); }
  onLang(()=>{ lines=newsLines(); li=0; ci=0; });
  typ();
}

export function initEpisode(){
  const chip=document.getElementById('epchip');
  if(!chip) return;
  const ep=content().episode;
  if(!ep || !(ep.num || ep.fr || ep.en)){ chip.hidden=true; return; }
  const num=document.getElementById('epnum');
  const title=document.getElementById('eptitle');
  function render(){
    if(num) num.textContent = ep.num || '';
    if(title) title.textContent = getLang()==='en' ? (ep.en||ep.fr||'') : (ep.fr||ep.en||'');
  }
  render(); onLang(render); chip.hidden=false;
}

export function initAssets(){
  (function(){ const el=document.querySelector('.logo'); if(!el) return;
    const srcs=['assets/logo.png','assets/logo.svg']; let i=0; const im=new Image();
    im.onload=()=>{ el.src=im.src; el.style.display='block'; const w=document.querySelector('.word'); if(w) w.style.display='none'; };
    im.onerror=()=>{ if(++i<srcs.length) im.src=srcs[i]; };
    im.src=srcs[0]; })();

  (function(){ const box=document.querySelector('.xana'); if(!box) return;
    const im=new Image();
    im.onload=()=>{ box.innerHTML=''; box.appendChild(im); };
    im.src='assets/xana.png'; })();

  (function(){ const el=document.getElementById('bgart'); if(!el) return;
    const srcs=['assets/bg.png','assets/bg.jpg']; let i=0; const im=new Image();
    im.onload=()=>{ el.style.backgroundImage=`url(${im.src})`; el.style.opacity='.55'; };
    im.onerror=()=>{ if(++i<srcs.length) im.src=srcs[i]; };
    im.src=srcs[0]; })();
}
