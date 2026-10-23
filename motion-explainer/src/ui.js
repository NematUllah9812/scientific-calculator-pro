// Canvas-2D drawing helpers for panel face textures (white border + white text UI, accent #ff8a4c).
// Every draw function takes explicit progress/time values so it stays deterministic.

export const ACCENT = '#ff8a4c';
export const WHITE = '#ffffff';
export const DIM = 'rgba(255,255,255,0.55)';
export const GREEN = '#4ade80';
export const FONT = '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", sans-serif';

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx, w, h };
}

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function setFont(ctx, weight, size, family = FONT) {
  ctx.font = `${weight} ${size}px ${family}`;
}

// Text with optional tracking (letter-spacing) and alpha.
export function text(ctx, str, x, y, opts = {}) {
  const {
    size = 48, weight = 600, color = WHITE, align = 'left', baseline = 'alphabetic',
    tracking = 0, alpha = 1, family = FONT,
  } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  setFont(ctx, weight, size, family);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`;
  const width = ctx.measureText(str).width;
  let x0 = x;
  if (align === 'center') x0 = x - width / 2;
  else if (align === 'right') x0 = x - width;
  ctx.textAlign = 'left';
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(str, x0, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();
}

export function measureTracked(ctx, str, tracking) {
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${tracking}px`;
    const w = ctx.measureText(str).width;
    ctx.letterSpacing = '0px';
    return w;
  }
  return ctx.measureText(str).width + tracking * (str.length - 1);
}

// White rounded border used on every panel face.
export function border(ctx, w, h, opts = {}) {
  const { inset = 6, radius = 28, lw = 5, color = 'rgba(255,255,255,0.92)', alpha = 1 } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  rr(ctx, inset, inset, w - inset * 2, h - inset * 2, radius);
  ctx.stroke();
  ctx.restore();
}

// Animated checkmark: stroke draws on over progress p (0→1).
export function checkmark(ctx, x, y, size, p, opts = {}) {
  const { color = WHITE, lw = 8, alpha = 1 } = opts;
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const p1 = [x - size * 0.42, y + size * 0.02];
  const p2 = [x - size * 0.1, y + size * 0.34];
  const p3 = [x + size * 0.48, y - size * 0.3];
  const l1 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const l2 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
  const total = l1 + l2;
  const draw = total * p;
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  const seg1 = Math.min(draw, l1);
  const k1 = seg1 / l1;
  ctx.lineTo(p1[0] + (p2[0] - p1[0]) * k1, p1[1] + (p2[1] - p1[1]) * k1);
  if (draw > l1) {
    const seg2 = Math.min(draw - l1, l2);
    const k2 = seg2 / l2;
    ctx.lineTo(p2[0] + (p3[0] - p2[0]) * k2, p2[1] + (p3[1] - p2[1]) * k2);
  }
  ctx.stroke();
  ctx.restore();
}

// Small flame glyph (no emoji fonts in headless renderers).
export function flame(ctx, x, y, s, color = ACCENT, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.bezierCurveTo(0.55, -0.35, 0.75, 0.1, 0.42, 0.62);
  ctx.bezierCurveTo(0.2, 0.92, -0.2, 0.92, -0.42, 0.62);
  ctx.bezierCurveTo(-0.75, 0.1, -0.35, -0.25, 0, -1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Round bullet / window dot.
export function dot(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Typing caret block.
export function caret(ctx, x, y, h, on, color = WHITE) {
  if (!on) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(4, h * 0.08), h);
  ctx.restore();
}

// Soft glow disc behind something bright (radial gradient).
export function glow(ctx, x, y, r, color = 'rgba(255,138,76,0.55)') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// Horizontal strike line drawn left→right over progress p.
export function strike(ctx, x, y, w, p, opts = {}) {
  const { color = 'rgba(255,255,255,0.8)', lw = 5 } = opts;
  if (p <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * p, y);
  ctx.stroke();
  ctx.restore();
}

export function clear(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
}
