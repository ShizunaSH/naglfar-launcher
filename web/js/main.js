import { loadContent } from './content.js';
import { applyLang, initLangSwitch } from './i18n.js';
import { initParticles, initGlitch, initEpisode, initAssets } from './ambience.js';
import { initChangelog } from './changelog.js';
import { initGame } from './game.js';
import { initUpdater } from './updater.js';
import { initSettings } from './settings.js';
import { initShell } from './shell.js';

initParticles();

await loadContent();

initLangSwitch();
initChangelog();
initGame();
initUpdater();
initSettings();
initEpisode();

applyLang();

initGlitch();
initShell();
initAssets();
