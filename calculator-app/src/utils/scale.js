/* =====================================================================
 * scale.js — Proportional "design pixel" scaling.
 *
 * The entire UI is authored against a fixed 412 x 929 design canvas
 * (the reference phone). At runtime we compute a single scalar `u`
 * (the design pixel) so that the WHOLE layout shrinks or grows as one
 * piece. The arrangement of every element is therefore identical on
 * every device — only its physical size changes.
 *
 *   u = min(viewportW / 412, viewportH / 929)
 *
 * `u` is published as the CSS custom property `--u`, so stylesheets can
 * size things with calc(N * var(--u)). JS-side consumers (lucide icon
 * pixel sizes) use the numeric value returned by useScale().
 * ===================================================================== */

import { useState, useEffect } from 'react';

export const DESIGN_W = 412;
export const DESIGN_H = 929;

/** Clamp keeps text legible on very small screens and sane on tablets. */
const MIN_U = 0.62;
const MAX_U = 1.45;

export function computeScale(w, h) {
  const raw = Math.min(w / DESIGN_W, h / DESIGN_H);
  return Math.max(MIN_U, Math.min(MAX_U, raw));
}

function currentViewport() {
  if (typeof window === 'undefined') return { w: DESIGN_W, h: DESIGN_H };
  const vv = window.visualViewport;
  return {
    w: Math.round(vv?.width || window.innerWidth || DESIGN_W),
    h: Math.round(vv?.height || window.innerHeight || DESIGN_H),
  };
}

export function useScale() {
  const [scale, setScale] = useState(() => {
    const { w, h } = currentViewport();
    return computeScale(w, h);
  });

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { w, h } = currentViewport();
        const u = computeScale(w, h);
        document.documentElement.style.setProperty('--u', `${u}px`);
        document.documentElement.style.setProperty('--app-w', `${Math.min(w, DESIGN_W * u)}px`);
        setScale(u);
      });
    };

    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', apply);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
      if (vv) vv.removeEventListener('resize', apply);
    };
  }, []);

  return scale;
}

/** Design-pixel length for inline styles: px(14) -> 'calc(14 * var(--u))' */
export const px = (n) => `calc(${n} * var(--u))`;

/** Icon pixel size for lucide (needs a real number). */
export const ico = (scale, n) => Math.max(8, Math.round(n * scale));
