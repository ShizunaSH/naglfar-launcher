let CONTENT = { episode: null, versions: [] };

export function content(){ return CONTENT; }

export async function loadContent(){
  try{
    const r = await fetch('changelog.json', { cache: 'no-store' });
    if(r.ok){
      const j = await r.json();
      CONTENT = {
        episode: j && j.episode ? j.episode : null,
        versions: j && Array.isArray(j.versions) ? j.versions : [],
      };
    }
  }catch(e){}
  return CONTENT;
}
