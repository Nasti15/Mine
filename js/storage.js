const KEY_SETTINGS = 'mine_settings_v1';
const KEY_UNLOCKED = 'mine_unlocked_v1';
const keyBest = (startLevel) => `mine_best_${startLevel}_v1`;

function safeGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch (e) { return fallback; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

export function loadSettings() {
  return {
    theme: 'dark',
    lang: 'ru',
    volume: 0.5,
    ...safeGet(KEY_SETTINGS, {})
  };
}

export function saveSettings(s) {
  safeSet(KEY_SETTINGS, s);
}

export function loadUnlocked() {
  const v = safeGet(KEY_UNLOCKED, 1);
  return Math.max(1, Math.min(3, Number(v) || 1));
}

export function saveUnlocked(n) {
  safeSet(KEY_UNLOCKED, Math.max(1, Math.min(3, n)));
}

export function loadBestTime(startLevel) {
  const v = safeGet(keyBest(startLevel), null);
  return typeof v === 'number' && isFinite(v) ? v : null;
}

export function saveBestTime(startLevel, time) {
  safeSet(keyBest(startLevel), time);
}