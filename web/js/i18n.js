export const I18N = {
  fr:{
    online:"EN LIGNE",
    chip:"ÉPISODE",
    play:"LANCER", play_install:"INSTALLER", play_repair:"RÉPARER", play_update:"METTRE À JOUR", pause:"Pause", resume:"Reprendre",
    ready:"Prêt à jouer", st_missing:"Jeu non installé", st_repair:"Réparation nécessaire", st_busy:"Opération en cours…", st_update:"Nouvelle version disponible",
    g_ready:"Jeu", g_missing:"Jeu non installé",
    dl_game:"TÉLÉCHARGEMENT DU JEU", dl_done:"Jeu prêt ✓", dl_err:"Échec du téléchargement du jeu.",
    dl_progress:"Téléchargement du jeu…", lu_pill:"Mettre à jour le launcher", cancel:"Annuler",
    virt:"LANCEMENT…", dl:"TÉLÉCHARGEMENT…",
    update:"Mettre à jour", uptodate:"À jour ✓", checking:"Recherche…",
    v_run:"VÉRIFICATION DES FICHIERS…", v_ok:"FICHIERS INTÈGRES ✓",
    v_unverified:"Fichiers présents (empreinte non vérifiable).",
    v_missing:"Jeu introuvable — clique INSTALLER pour le télécharger.",
    v_corrupt:"Fichiers corrompus — réparation en cours.",
    v_offline:"Vérification indisponible (hors application).",
    s_changelog:"Notes de version",
    cl_tag:"JOURNAL DE BORD", cl_title:"Notes de version", cl_latest:"ACTUEL",
    cat_new:"Nouveau", cat_bal:"Équilibrage", cat_fix:"Correctif", cat_ui:"Interface",
    t_discord:"Discord", t_youtube:"Chaîne YouTube", t_twitter:"Twitter / X", t_site:"Site officiel",
    settings:"Options",
    set_game:"Jeu", set_updates:"Mises à jour", set_launcher:"Launcher",
    gf_title:"Dossier du jeu",
    gf_desc:"Emplacement d'installation du jeu. Le launcher le vérifie avant de lancer.",
    gf_change:"Changer de dossier…", gf_none:"Aucun dossier défini",
    rep_title:"Réparation",
    rep_desc:"Vérifie chaque fichier et re-télécharge ce qui manque ou est corrompu.",
    rep_btn:"Vérifier et réparer",
    gver_label:"Version installée",
    ug_title:"Mise à jour du jeu",
    ug_desc:"Cherche une nouvelle version du jeu et l'installe.",
    ug_btn:"Vérifier", ug_dl:"Télécharger la mise à jour", ug_none:"Aucune mise à jour", ug_pill:"Mettre à jour le jeu",
    lu_title:"Mise à jour du launcher",
    lu_desc:"Le launcher se met à jour au démarrage. Vérifie maintenant si tu préfères ne pas attendre.",
    lu_btn:"Vérifier maintenant",
    fold_title:"Dossiers",
    fold_desc:"Accès rapide à tes fichiers de jeu.",
    fold_saves:"Sauvegardes", fold_install:"Installation",
    diag_title:"Rapport de diagnostic",
    diag_desc:"Enregistre logs, réglages et détails d'installation dans un zip à joindre à un rapport de bug. Aucun mot de passe ni donnée de compte.",
    diag_btn:"Enregistrer le rapport", diag_done:"Rapport enregistré ✓",
  },
  en:{
    online:"ONLINE",
    chip:"EPISODE",
    play:"PLAY", play_install:"INSTALL", play_repair:"REPAIR", play_update:"UPDATE", pause:"Pause", resume:"Resume",
    ready:"Ready to play", st_missing:"Game not installed", st_repair:"Repair needed", st_busy:"Working…", st_update:"New version available",
    g_ready:"Game", g_missing:"Game not installed",
    dl_game:"DOWNLOADING GAME", dl_done:"Game ready ✓", dl_err:"Game download failed.",
    dl_progress:"Downloading game…", lu_pill:"Update the launcher", cancel:"Cancel",
    virt:"LAUNCHING…", dl:"DOWNLOADING…",
    update:"Update", uptodate:"Up to date ✓", checking:"Checking…",
    v_run:"VERIFYING FILES…", v_ok:"FILES INTACT ✓",
    v_unverified:"Files present (checksum unavailable).",
    v_missing:"Game not found — click INSTALL to download it.",
    v_corrupt:"Corrupted files — repairing.",
    v_offline:"Verification unavailable (outside the app).",
    s_changelog:"Changelog",
    cl_tag:"CHANGELOG", cl_title:"Changelog", cl_latest:"LATEST",
    cat_new:"New", cat_bal:"Balance", cat_fix:"Fix", cat_ui:"UI",
    t_discord:"Discord", t_youtube:"YouTube channel", t_twitter:"Twitter / X", t_site:"Official site",
    settings:"Settings",
    set_game:"Game", set_updates:"Updates", set_launcher:"Launcher",
    gf_title:"Game folder",
    gf_desc:"Where the game is installed. The launcher checks it before you can play.",
    gf_change:"Change folder…", gf_none:"No folder set",
    rep_title:"Repair",
    rep_desc:"Checks every file and re-downloads anything missing or damaged.",
    rep_btn:"Check & repair files",
    gver_label:"Installed version",
    ug_title:"Game update",
    ug_desc:"Looks for a new game version and installs it.",
    ug_btn:"Check", ug_dl:"Download update", ug_none:"No update", ug_pill:"Update the game",
    lu_title:"Launcher updates",
    lu_desc:"The launcher updates itself on startup. Check now if you'd rather not wait.",
    lu_btn:"Check for launcher update",
    fold_title:"Folders",
    fold_desc:"Quick access to your game files.",
    fold_saves:"Saves", fold_install:"Install",
    diag_title:"Diagnostics report",
    diag_desc:"Saves logs, settings and install details into one zip to attach to a bug report. No passwords or account data.",
    diag_btn:"Save diagnostics report", diag_done:"Report saved ✓",
  },
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
