export const I18N = {
  fr:{ online:"EN LIGNE", chip:"DERNIER ÉPISODE", play:"JOUER",
    play_install:"INSTALLER", play_repair:"RÉPARER",
    g_missing:"Jeu non installé", g_ready:"Jeu", g_check:"Recherche du jeu…",
    dl_game:"TÉLÉCHARGEMENT DU JEU", dl_done:"Jeu prêt ✓", dl_err:"Échec du téléchargement du jeu.",
    update:"Mettre à jour", uptodate:"À jour ✓", checking:"Recherche…", installed:"Installé", news:"NOUVEAUTÉS",
    s_install:"Dossier d'installation", s_saves:"Dossier des sauvegardes", s_verify:"Vérifier les fichiers", s_changelog:"Notes de version", s_options:"Options", s_lang:"Langue",
    t_discord:"Discord", t_youtube:"Chaîne YouTube", t_twitter:"Twitter / X", t_site:"Site officiel",
    cl_tag:"JOURNAL DE BORD", cl_title:"Notes de version", cl_latest:"ACTUEL",
    cat_new:"Nouveau", cat_bal:"Équilibrage", cat_fix:"Correctif", cat_ui:"Interface",
    v_run:"VÉRIFICATION DES FICHIERS…", v_ok:"FICHIERS INTÈGRES ✓",
    v_unverified:"CLR.exe présent (empreinte non vérifiable — manifest absent).",
    v_missing:"CLR.exe INTROUVABLE — clique INSTALLER pour télécharger le jeu.",
    v_corrupt:"CLR.exe CORROMPU — clique RÉPARER pour re-télécharger le jeu.",
    v_offline:"Vérification indisponible (hors application).",
    virt:"VIRTUALISATION…", dl:"TÉLÉCHARGEMENT DU PAQUET…" },
  en:{ online:"ONLINE", chip:"LATEST EPISODE", play:"PLAY",
    play_install:"INSTALL", play_repair:"REPAIR",
    g_missing:"Game not installed", g_ready:"Game", g_check:"Checking game…",
    dl_game:"DOWNLOADING GAME", dl_done:"Game ready ✓", dl_err:"Game download failed.",
    update:"Update", uptodate:"Up to date ✓", checking:"Checking…", installed:"Installed", news:"NEWS",
    s_install:"Install folder", s_saves:"Saves folder", s_verify:"Verify files", s_changelog:"Changelog", s_options:"Options", s_lang:"Language",
    t_discord:"Discord", t_youtube:"YouTube channel", t_twitter:"Twitter / X", t_site:"Official site",
    cl_tag:"CHANGELOG", cl_title:"Changelog", cl_latest:"LATEST",
    cat_new:"New", cat_bal:"Balance", cat_fix:"Fix", cat_ui:"UI",
    v_run:"VERIFYING FILES…", v_ok:"FILES INTACT ✓",
    v_unverified:"CLR.exe present (checksum unavailable — manifest missing).",
    v_missing:"CLR.exe MISSING — click INSTALL to download the game.",
    v_corrupt:"CLR.exe CORRUPTED — click REPAIR to re-download the game.",
    v_offline:"Verification unavailable (outside the app).",
    virt:"VIRTUALIZING…", dl:"DOWNLOADING PACKAGE…" },
};

let lang = localStorage.getItem("clr_lang");
if(!I18N[lang]){ const n=(navigator.language||"fr").slice(0,2); lang = I18N[n] ? n : "fr"; }

const subscribers = [];

export function onLang(cb){ subscribers.push(cb); }

export function getLang(){ return lang; }
export function dict(){ return I18N[lang]; }
export function t(key){ return I18N[lang][key]; }

export function applyLang(){
  const d = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); if(d[k]!=null) el.textContent=d[k]; });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{ const k=el.getAttribute('data-i18n-title'); if(d[k]!=null) el.title=d[k]; });
  document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on', b.dataset.l===lang));
  document.documentElement.lang=lang;
  subscribers.forEach(cb=>cb());
}

export function initLangSwitch(){
  document.querySelectorAll('.lang button').forEach(b=> b.onclick=()=>{
    lang=b.dataset.l; localStorage.setItem('clr_lang',lang); applyLang();
  });
}
