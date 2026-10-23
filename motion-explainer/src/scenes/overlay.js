import * as THREE from 'three';
import { makePanel, makeGlass, makeCanvasPlane } from '../panels.js';
import { text, border, rr, ACCENT, WHITE, FONT } from '../ui.js';
import { OVERLAY_TEXT, OVERLAY_PILL, seg, clamp, lerp, easeOutCubic, easeOutBack, easeOutExpo } from '../timeline.js';

// Reveal (12.5–15s) — fixed to the camera:
// "ONE CONVERSATION / Idea → App" + a small glass pill "Built with Claude Code".
//
// Render layers: layer 0 = world (goes through bloom + scrim), layer 1 = overlay text
// (drawn after the grade pass so the titles stay bright above the dark scrim).

export function buildOverlay(camera) {
  const group = new THREE.Group();
  camera.add(group);

  const onOverlay = (obj) => {
    obj.traverse((c) => c.layers.set(1));
    return obj;
  };

  // line 1 — "ONE CONVERSATION"
  const line1 = makeCanvasPlane(2.72, 0.34, 2048, 256, (ctx, w, h, t) => {
    const p = seg(t, OVERLAY_TEXT[0], OVERLAY_TEXT[1], easeOutCubic);
    if (p <= 0.01) return;
    text(ctx, 'ONE CONVERSATION', w / 2, h / 2, {
      size: 112, weight: 800, color: WHITE, align: 'center', baseline: 'middle',
      tracking: 26, alpha: p,
    });
  });
  line1.mesh.position.set(0, 0.47, -3.1);
  onOverlay(line1.mesh);
  group.add(line1.mesh);

  // line 2 — "Idea → App" with accent arrow
  const line2 = makeCanvasPlane(2.55, 0.52, 2048, 420, (ctx, w, h, t) => {
    const p = seg(t, OVERLAY_TEXT[0] + 0.12, OVERLAY_TEXT[1] + 0.12, easeOutCubic);
    if (p <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.font = `800 190px ${FONT}`;
    ctx.textBaseline = 'middle';
    const parts = [
      { s: 'Idea ', c: WHITE },
      { s: '\u2192 ', c: ACCENT },
      { s: 'App', c: WHITE },
    ];
    const widths = parts.map((pt) => ctx.measureText(pt.s).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = w / 2 - total / 2;
    for (let i = 0; i < parts.length; i++) {
      ctx.fillStyle = parts[i].c;
      ctx.fillText(parts[i].s, x, h / 2 + 8);
      x += widths[i];
    }
    ctx.restore();
  });
  line2.mesh.position.set(0, 0.02, -3.1);
  onOverlay(line2.mesh);
  group.add(line2.mesh);

  // glass pill body (world layer, picks up scrim + glass shading)
  const pill = makePanel({
    w: 1.32, h: 0.37, d: 0.09, r: 0.185,
    faceW: 1100, faceH: 308,
    draw(ctx, w, h, t) {
      const p = seg(t, OVERLAY_PILL[0], OVERLAY_PILL[1], easeOutCubic);
      if (p <= 0.01) return;
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      rr(ctx, 6, 6, w - 12, h - 12, 54);
      ctx.fill();
      border(ctx, w, h, { inset: 6, radius: 54, lw: 5, alpha: 0.85 });
    },
    material: makeGlass({ transmission: 0.85, roughness: 0.38, thickness: 0.35 }),
  });
  pill.group.position.set(0, -0.62, -3.0);
  group.add(pill.group);

  // pill label on the overlay layer (bright, above scrim)
  const pillText = makeCanvasPlane(1.12, 0.3, 1100, 300, (ctx, w, h, t) => {
    const p = seg(t, OVERLAY_PILL[0], OVERLAY_PILL[1], easeOutCubic);
    if (p <= 0.01) return;
    text(ctx, 'Built with Claude Code', w / 2, h / 2, {
      size: 78, weight: 600, color: WHITE, align: 'center', baseline: 'middle', alpha: p,
    });
  });
  pillText.mesh.position.set(0, -0.62, -2.94);
  onOverlay(pillText.mesh);
  group.add(pillText.mesh);

  return {
    group,
    update(t) {
      line1.redraw(t);
      line2.redraw(t);
      pill.redraw(t);
      pillText.redraw(t);

      const p1 = seg(t, OVERLAY_TEXT[0], OVERLAY_TEXT[1], easeOutExpo);
      const p2 = seg(t, OVERLAY_TEXT[0] + 0.12, OVERLAY_TEXT[1] + 0.12, easeOutExpo);
      line1.mesh.position.y = 0.47 + (1 - p1) * -0.1;
      line2.mesh.position.y = 0.02 + (1 - p2) * -0.12;
      const pp = seg(t, OVERLAY_PILL[0], OVERLAY_PILL[1] + 0.1, (k) => easeOutBack(k, 1.9));
      const s = lerp(0.6, 1, clamp(pp));
      pill.group.scale.setScalar(s);
      pillText.mesh.scale.setScalar(s);
      pill.group.position.y = -0.62 + (1 - clamp(pp)) * -0.08;
      pillText.mesh.position.y = -0.62 + (1 - clamp(pp)) * -0.08;
      const vis = t > OVERLAY_PILL[0] - 0.05;
      pill.group.visible = vis;
      pillText.mesh.visible = vis;
    },
  };
}
