import { Game } from './game.js';
import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { translations } from './i18n.js';
import { LEVELS } from './levels.js';
import * as storage from './storage.js';

// ============= SETUP =============
const canvas = document.getElementById('game');
const input = new Input();
const audio = new AudioManager();

let settings = storage.loadSettings();
let startLevel = 0;
let loopRunning = false;
let rafId = null;
let lastFrameTime = 0;

const game = new Game(canvas, input, audio, {
  onDeath: () => {
    stopLoop();
    showOverlay('gameover-overlay');
  },
  onLevelComplete: (info) => {
    stopLoop();
    handleLevelComplete(info);
  },
});

// ============= TRANSLATIONS =============
function t(key) {
  return translations[settings.lang][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // Динамические элементы
  updateSettingsUI();
  renderLevelList();
  updateHUD();
}

function updateSettingsUI() {
  const themeBtn = document.getElementById('theme-toggle');
  const langBtn = document.getElementById('lang-toggle');
  const volInput = document.getElementById('volume');
  themeBtn.textContent = settings.theme === 'dark' ? t('dark') : t('light');
  langBtn.textContent = settings.lang.toUpperCase();
  volInput.value = Math.round(settings.volume * 100);
}

function applySettings() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  game.setTheme(settings.theme);
  audio.setVolume(settings.volume);
  applyTranslations();
}

function saveSettings() {
  storage.saveSettings(settings);
  applySettings();
}

// ============= SCREENS =============
function showScreen(name) {
  ['menu', 'levels-screen', 'settings-screen'].forEach(id => {
    document.getElementById(id).classList.toggle('hidden', id !== name);
  });
  const inGame = name === 'playing';
  canvas.style.display = inGame ? 'block' : 'none';
  document.getElementById('hud').classList.toggle('hidden', !inGame);
  document.getElementById('btn-pause').classList.toggle('hidden', !inGame);
  document.getElementById('touch-controls').classList.toggle('hidden', !inGame);
  if (!inGame) {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('btn-pause').classList.add('hidden');
    document.getElementById('touch-controls').classList.add('hidden');
  }
}

function hideOverlays() {
  ['pause-overlay', 'complete-overlay', 'gameover-overlay', 'victory-overlay']
    .forEach(id => document.getElementById(id).classList.add('hidden'));
}

function showOverlay(id) {
  hideOverlays();
  document.getElementById(id).classList.remove('hidden');
}

// ============= LEVEL LIST =============
function renderLevelList() {
  const list = document.getElementById('level-list');
  if (!list) return;
  list.innerHTML = '';
  const unlocked = storage.loadUnlocked();
  LEVELS.forEach((lvl, i) => {
    const isUnlocked = i < unlocked;
    const best = storage.loadBestTime(i);
    const card = document.createElement('button');
    card.className = 'level-card' + (isUnlocked ? '' : ' locked');
    card.disabled = !isUnlocked;
    card.innerHTML = `
      <div class="lc-info">
        <span class="lc-name">${t('level')} ${i + 1}: ${t(lvl.nameKey)}</span>
        <span class="lc-meta">${t(lvl.diffKey)} · ${lvl.diamonds.length} ${t('diamondsShort')}</span>
      </div>
      <span class="lc-best">${isUnlocked ? (best !== null ? formatTime(best) : '—') : t('locked')}</span>
    `;
    if (isUnlocked) {
      card.addEventListener('click', () => {
        audio.init(); audio.resume(); audio.click();
        startRun(i);
      });
    }
    list.appendChild(card);
  });
}

// ============= GAME FLOW =============
function startRun(startIdx) {
  startLevel = startIdx;
  game.startLevel(startIdx, true); // сбрасываем таймер
  enterGameplay();
}

function enterGameplay() {
  hideOverlays();
  showScreen('playing');
  input.enabled = true;
  input.clear();
  audio.resume();
  audio.startMusic();
  startLoop();
}

function pauseGame() {
  if (!loopRunning) return;
  if (game.state !== 'playing') return;
  game.state = 'paused';
  input.enabled = false;
  input.clear();
  stopLoop();
  audio.stopMusic();
  showOverlay('pause-overlay');
}

function resumeGame() {
  hideOverlays();
  game.state = 'playing';
  input.enabled = true;
  input.clear();
  audio.resume();
  audio.startMusic();
  startLoop();
}

function retryLevel() {
  hideOverlays();
  // Перезапуск текущего уровня; общий таймер продолжается (смерть стоит времени)
  game.loadLevel(game.levelIndex);
  enterGameplay();
}

function handleLevelComplete(info) {
  const isLast = info.level >= LEVELS.length - 1;
  const unlocked = storage.loadUnlocked();
  const newUnlocked = Math.min(3, Math.max(unlocked, info.level + 2));
  if (newUnlocked > unlocked) storage.saveUnlocked(newUnlocked);

  if (isLast) {
    // Победа!
    const best = storage.loadBestTime(startLevel);
    const isRecord = best === null || info.totalTime < best;
    if (isRecord) storage.saveBestTime(startLevel, info.totalTime);

    document.getElementById('victory-time').textContent =
      `${t('totalTime')}: ${formatTime(info.totalTime)}`;
    document.getElementById('victory-best').textContent =
      isRecord
        ? `🏆 ${t('newRecord')}`
        : `${t('bestTime')}: ${formatTime(best)}`;
    showOverlay('victory-overlay');
  } else {
    document.getElementById('complete-title').textContent =
      `${t('levelComplete')} (${info.level + 1}/${LEVELS.length})`;
    document.getElementById('complete-time').textContent =
      `${t('totalTime')}: ${formatTime(info.totalTime)}`;
    showOverlay('complete-overlay');
  }
}

function goToMenu() {
  stopLoop();
  audio.stopMusic();
  input.enabled = false;
  hideOverlays();
  showScreen('menu');
  renderLevelList();
}

function nextLevel() {
  const next = game.levelIndex + 1;
  if (next >= LEVELS.length) { goToMenu(); return; }
  hideOverlays();
  game.loadLevel(next);
  enterGameplay();
}

// ============= LOOP =============
function startLoop() {
  if (loopRunning) return;
  loopRunning = true;
  lastFrameTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  loopRunning = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function loop(now) {
  if (!loopRunning) return;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  if (game.state === 'playing') {
    game.update(dt);
  }
  game.render();
  updateHUD();

  if (loopRunning) {
    rafId = requestAnimationFrame(loop);
  }
}

function updateHUD() {
  if (!game.totalDiamonds && !game.diamondsCollected) {
    document.getElementById('hud-diamonds').textContent = '0/0';
  } else {
    document.getElementById('hud-diamonds').textContent =
      `${game.diamondsCollected}/${game.totalDiamonds}`;
  }
  document.getElementById('hud-time').textContent = formatTime(game.totalTime);
  const best = storage.loadBestTime(startLevel);
  document.getElementById('hud-best').textContent =
    best !== null ? formatTime(best) : '—';
}

function formatTime(sec) {
  if (sec === null || sec === undefined || !isFinite(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ============= EVENT BINDINGS =============
function bindClick(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', () => {
    audio.init();
    audio.resume();
    audio.click();
    fn();
  });
}

bindClick('btn-start', () => startRun(0));
bindClick('btn-levels', () => { showScreen('levels-screen'); renderLevelList(); });
bindClick('btn-settings', () => { showScreen('settings-screen'); updateSettingsUI(); });
document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', () => { audio.click(); showScreen('menu'); });
});

bindClick('btn-pause', pauseGame);
bindClick('btn-resume', resumeGame);
bindClick('btn-restart', retryLevel);
bindClick('btn-menu', goToMenu);
bindClick('btn-retry', retryLevel);
bindClick('btn-go-menu', goToMenu);
bindClick('btn-next', nextLevel);
bindClick('btn-victory-menu', goToMenu);

// Settings
document.getElementById('theme-toggle').addEventListener('click', () => {
  audio.init(); audio.resume(); audio.click();
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  saveSettings();
  if (game.player) game.render();
});
document.getElementById('lang-toggle').addEventListener('click', () => {
  audio.init(); audio.resume(); audio.click();
  settings.lang = settings.lang === 'ru' ? 'en' : 'ru';
  saveSettings();
  // Обновляем заголовок
  if (game.state === 'playing' || game.state === 'paused') updateHUD();
});
document.getElementById('volume').addEventListener('input', (e) => {
  settings.volume = Number(e.target.value) / 100;
  saveSettings();
});

// Visibility pause
document.addEventListener('visibilitychange', () => {
  if (document.hidden && loopRunning && game.state === 'playing') {
    pauseGame();
  }
});

// Audio unlock
document.addEventListener('pointerdown', () => {
  audio.init();
  audio.resume();
}, { once: true });

// ============= TOUCH CONTROLS =============
function bindTouch(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.setKey(key, true);
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
  });
  const up = (e) => { e.preventDefault(); input.setKey(key, false); };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindTouch('btn-left', 'left');
bindTouch('btn-right', 'right');
bindTouch('btn-jump', 'jump');

// ============= INIT =============
applySettings();
game.startLevel(0, true); // предзагрузка, чтобы рендер не падал
showScreen('menu');