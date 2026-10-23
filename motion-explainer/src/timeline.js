// Master timeline + easing + tiny math helpers. Everything is a pure function of t (seconds).

export const FPS = 60;
export const DURATION = 15;
export const FRAMES = DURATION * FPS; // 900
export const WIDTH = 1920;
export const HEIGHT = 1080;

// ---- scene content windows (from the brief) ----
export const WIN = {
  s1: [0, 3],       // Describe it
  s2: [3, 6],       // Plan it
  s3: [6, 9.5],     // Build it
  s4: [10, 12.5],   // Ship it
  s5: [12.5, 15],   // Reveal
};

// ---- camera shots: holds + whips ----
export const CAM = {
  hold1: [0, 2.55],
  whip1: [2.55, 3.1],
  hold2: [3.1, 5.55],
  whip2: [5.55, 6.1],
  hold3: [6.1, 9.45],
  whip3: [9.45, 10.05],
  hold4: [10.05, 12.45],
  pullback: [12.45, 13.3],
  hold5: [13.3, 15],
};

export const TUBE_PROGRESS = [0.1, 13.0];
export const SCRIM = [12.55, 13.35];
export const OVERLAY_TEXT = [12.95, 13.65];
export const OVERLAY_PILL = [13.35, 14.1];

// ---- math ----
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const norm = (t, a, b) => clamp((t - a) / (b - a));
export const mix3 = (a, b, k, out) => {
  out.x = lerp(a.x, b.x, k); out.y = lerp(a.y, b.y, k); out.z = lerp(a.z, b.z, k);
  return out;
};

// ---- easing ----
export const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
export const easeInCubic = (k) => k * k * k;
export const easeInOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOutQuint = (k) => 1 - Math.pow(1 - k, 5);
export const easeOutExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const easeInExpo = (k) => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10));
export const easeInOutExpo = (k) =>
  k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2;
export const easeOutBack = (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
export const easeOutElastic = (k) => {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  const c = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * c) + 1;
};
export const smoothstep = (k) => k * k * (3 - 2 * k);

// window helper: eased 0→1 across [a,b] with optional easing fn
export const seg = (t, a, b, ease = smoothstep) => ease(norm(t, a, b));
