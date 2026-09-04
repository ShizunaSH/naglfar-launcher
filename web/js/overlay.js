const ov  = document.getElementById('ov');
const ovm = document.getElementById('ovm');
const bar = () => ov.querySelector('.m i b');

export function setText(text){ ovm.childNodes[0].textContent = text; }

export function show(text){ if(text!=null) setText(text); ov.classList.add('on'); }

export function hide(delay){
  if(delay) setTimeout(()=>ov.classList.remove('on','det'), delay);
  else ov.classList.remove('on','det');
}

export function beginProgress(text){ ov.classList.add('on','det'); const b=bar(); if(b) b.style.width='0%'; if(text!=null) setText(text); }

export function setProgress(pct){ const b=bar(); if(b) b.style.width=pct+'%'; }
