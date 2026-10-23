import * as THREE from 'three';
import { makePanel, makeGlass } from '../panels.js';
import { text, border, checkmark, strike, rr, ACCENT, WHITE, FONT } from '../ui.js';
import { stageGroup, makeStageLabel } from './common.js';
import { norm, clamp, seg, easeOutExpo, easeOutCubic, smoothstep, lerp } from '../timeline.js';

// Scene 2 "Plan it" (3–6s):
// a stack of glass cards in depth. Five tasks slide in, then tick off one by one
// with animated checkmark + strikethrough.

const TASKS = [
  'Design streak logic',
  'Build habit list UI',
  'Add daily check-off',
  'Charts & stats screen',
  'Polish & ship build',
];

export function buildPlan(scene) {
  const group = stageGroup(1);
  scene.add(group);
  const panels = [];

  const label = makeStageLabel(1, 'STEP 02', 'PLAN', makePanel);
  group.add(label.group);
  panels.push(label);

  const cards = [];
  for (let i = 0; i < 5; i++) {
    const card = makePanel({
      w: 4.45, h: 0.82, d: 0.13, r: 0.2,
      faceW: 1480, faceH: 272,
      draw(ctx, w, h, t) {
        const done = seg(t, 4.12 + i * 0.34, 4.34 + i * 0.34, easeOutCubic);
        const strikeP = seg(t, 4.3 + i * 0.34, 4.58 + i * 0.34, easeOutCubic);
        const dim = 1 - strikeP * 0.42;

        ctx.fillStyle = 'rgba(12,10,22,0.22)';
        rr(ctx, 6, 6, w - 12, h - 12, 36);
        ctx.fill();
        border(ctx, w, h, { inset: 6, radius: 36, lw: 4.5 });

        // checkbox
        const bx = 88, by = h / 2, r = 52;
        if (done > 0.02) {
          const g = ctx.createLinearGradient(bx - r, by - r, bx + r, by + r);
          g.addColorStop(0, '#ff9c60');
          g.addColorStop(1, '#ff7a2c');
          ctx.fillStyle = g;
          ctx.globalAlpha = Math.min(1, done * 1.4);
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = done > 0.02 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.stroke();
        checkmark(ctx, bx, by, r * 1.35, seg(t, 4.18 + i * 0.34, 4.52 + i * 0.34, easeOutCubic), {
          color: '#fff', lw: 11,
        });

        // task text
        const tx = 186;
        text(ctx, TASKS[i], tx, h / 2, {
          size: 82, weight: 600, color: WHITE, baseline: 'middle', alpha: dim,
        });
        ctx.font = `600 82px ${FONT}`;
        const tw = ctx.measureText(TASKS[i]).width;
        strike(ctx, tx, h / 2 + 3, tw * 1.02, strikeP, { color: 'rgba(255,255,255,0.85)', lw: 7 });

        // index chip
        text(ctx, `0${i + 1}`, w - 84, h / 2, {
          size: 56, weight: 700, color: 'rgba(255,255,255,0.35)', align: 'center', baseline: 'middle',
        });
      },
      material: makeGlass({ transmission: 0.9, roughness: 0.4, thickness: 0.45 }),
    });

    // fan positions in depth
    const bx = -0.62 + i * 0.2;
    const by = 1.28 - i * 0.66;
    const bz = 0.5 - i * 0.26;
    card.group.position.set(bx + 3.4, by, bz);
    card.group.rotation.y = 0.17 - i * 0.042;
    card.group.rotation.x = 0.02;
    group.add(card.group);
    panels.push(card);
    cards.push({ card, bx, by, bz, i });
  }

  return {
    group,
    update(t) {
      for (const c of cards) {
        const p = seg(t, 3.06 + c.i * 0.15, 3.62 + c.i * 0.15, easeOutExpo);
        c.card.group.position.x = lerp(c.bx + 3.4, c.bx, p);
        c.card.group.position.y = c.by + (1 - p) * 0.12;
        c.card.group.rotation.y = (0.17 - c.i * 0.042) + (1 - p) * 0.25;
      }
      for (const p of panels) p.redraw(t);
    },
  };
}
