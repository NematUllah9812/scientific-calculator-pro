/* =====================================================================
 * safeStorage.js — Exception-safe localStorage with in-memory fallback.
 * WebViews with storage disabled must never crash the app.
 * ===================================================================== */

const memory = new Map();
const PREFIX = 'sciCalcPro.';

let available = false;
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const probe = '__scp_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  }
} catch {
  available = false;
}

export const storageAvailable = () => available;

export function readRaw(key) {
  const k = PREFIX + key;
  try {
    if (available) return window.localStorage.getItem(k);
  } catch {
    /* fall through */
  }
  return memory.has(k) ? memory.get(k) : null;
}

export function writeRaw(key, value) {
  const k = PREFIX + key;
  memory.set(k, value);
  try {
    if (available) window.localStorage.setItem(k, value);
  } catch {
    /* ignore quota errors */
  }
}

export function load(key, fallback) {
  const raw = readRaw(key);
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    writeRaw(key, JSON.stringify(value));
  } catch {
    /* ignore circular refs */
  }
}

export function remove(key) {
  const k = PREFIX + key;
  memory.delete(k);
  try {
    if (available) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function clearAll() {
  memory.clear();
  try {
    if (!available) return;
    const doomed = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) doomed.push(k);
    }
    doomed.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  settings: 'settings',
  history: 'history',
  memory: 'memoryBanks',
  angleMode: 'angleMode',
  lastMode: 'lastMode',
  dataset: 'dataset',
};
