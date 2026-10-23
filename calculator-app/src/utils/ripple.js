/**
 * Touch ripple for the glass keycaps.
 *
 * A small circle is spawned at the touch point and scales up while fading
 * out, so every key press gives tactile-looking feedback even on devices
 * with no haptics.
 */
export function ripple(e) {
  const el = e.currentTarget;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.2;
  const span = document.createElement('span');
  span.className = 'key-ripple';
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;
  span.style.left = `${e.clientX - r.left - size / 2}px`;
  span.style.top = `${e.clientY - r.top - size / 2}px`;
  el.appendChild(span);
  setTimeout(() => span.remove(), 560);
}
