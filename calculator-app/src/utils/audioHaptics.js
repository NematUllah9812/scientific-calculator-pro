/* =====================================================================
 * audioHaptics.js — Web Audio oscillator synth + native vibration bridge
 * Zero external audio assets.
 * ===================================================================== */

let ctx = null;
let masterGain = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Must be called from a user gesture on mobile WebViews. */
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  try {
    const b = c.createBuffer(1, 1, 22050);
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(c.destination);
    s.start(0);
  } catch {
    /* ignore */
  }
}

/* --------------------- Sound profiles --------------------- */
export const SOUND_PROFILES = {
  none: { id: 'none', name: 'Silent' },
  click: { id: 'click', name: 'Soft Click', wave: 'sine', freq: 880, dur: 0.035, decay: 0.03 },
  beep: { id: 'beep', name: 'Casio Beep', wave: 'square', freq: 1320, dur: 0.05, decay: 0.045 },
  tick: { id: 'tick', name: 'Mechanical Tick', wave: 'triangle', freq: 2200, dur: 0.022, decay: 0.02 },
  bloop: { id: 'bloop', name: 'Modern Bloop', wave: 'sine', freq: 520, dur: 0.09, decay: 0.085, sweep: 260 },
  retro: { id: 'retro', name: '8-Bit Retro', wave: 'square', freq: 660, dur: 0.06, decay: 0.05, sweep: 180 },
};

export const SOUND_LIST = Object.values(SOUND_PROFILES);

/**
 * Play a synthesized key tone.
 * @param {string} profileId  key of SOUND_PROFILES
 * @param {number} volume     0..1
 * @param {string} variant    'key' | 'equals' | 'clear' | 'error'
 */
export function playSound(profileId = 'click', volume = 0.5, variant = 'key') {
  const p = SOUND_PROFILES[profileId];
  if (!p || p.id === 'none' || volume <= 0) return;
  const c = getCtx();
  if (!c) return;

  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();

    let freq = p.freq;
    let dur = p.dur;
    if (variant === 'equals') freq *= 1.5;
    else if (variant === 'clear') freq *= 0.6;
    else if (variant === 'error') {
      freq *= 0.4;
      dur *= 3;
    }

    osc.type = p.wave;
    osc.frequency.setValueAtTime(freq, now);
    if (p.sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq - p.sweep), now + dur);

    const peak = Math.max(0.0001, Math.min(1, volume) * 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + p.decay);

    osc.connect(gain);
    gain.connect(masterGain || c.destination);
    osc.start(now);
    osc.stop(now + dur + p.decay + 0.02);

    if (variant === 'error') {
      const osc2 = c.createOscillator();
      const g2 = c.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 0.75, now + 0.08);
      g2.gain.setValueAtTime(0.0001, now + 0.08);
      g2.gain.exponentialRampToValueAtTime(peak * 0.8, now + 0.09);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc2.connect(g2);
      g2.connect(masterGain || c.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.3);
    }
  } catch {
    /* ignore */
  }
}

/* --------------------- Haptics --------------------- */
export const HAPTIC_PATTERNS = {
  key: 12,
  equals: 26,
  clear: 20,
  error: [0, 40, 60, 40],
  toggle: 8,
};

export function vibrate(kind = 'key', enabled = true) {
  if (!enabled) return;
  const pattern = HAPTIC_PATTERNS[kind] ?? 12;
  try {
    // Prefer the native Android bridge when running inside the APK shell
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.vibrate) {
      const ms = Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern;
      window.AndroidBridge.vibrate(Math.round(ms));
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export function nativeToast(msg) {
  try {
    if (typeof window !== 'undefined' && window.AndroidBridge && window.AndroidBridge.showToast) {
      window.AndroidBridge.showToast(String(msg));
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export const isAndroidShell = () =>
  typeof window !== 'undefined' && !!window.AndroidBridge;

/** Unified feedback helper used by every keypad button. */
export function feedback(settings, variant = 'key') {
  if (!settings) return;
  if (settings.soundEnabled) playSound(settings.soundProfile, settings.soundVolume, variant);
  if (settings.hapticsEnabled) vibrate(variant, true);
}
