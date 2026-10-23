import * as THREE from 'three';
import { makePanel, makeGlass } from '../panels.js';
import { text, border, caret, dot, glow, rr, ACCENT, WHITE, DIM, FONT } from '../ui.js';
import { stageGroup, makeStageLabel } from './common.js';
import { norm, clamp, seg, easeOutCubic, easeOutBack, smoothstep } from '../timeline.js';

// Scene 1 "Describe it" (0–3s):
// glass chat bar types "Build me a habit tracker with streaks." with blinking caret,
// send button lights up, reply bubble shows typing dots then "On it. Here's the plan."

const PROMPT = 'Build me a habit tracker with streaks.';
const REPLY = "On it. Here's the plan.";

export function buildDescribe(scene) {
  const group = stageGroup(0);
  scene.add(group);
  const panels = [];

  // --- big label ---
  const label = makeStageLabel(0, 'STEP 01', 'DESCRIBE', makePanel);
  group.add(label.group);
  panels.push(label);

  // --- chat bar ---
  const sendBtnMat = makeGlass({ transmission: 0.75, roughness: 0.32, thickness: 0.3 });
  const chat = makePanel({
    w: 4.7, h: 1.02, d: 0.18, r: 0.34,
    faceW: 1880, faceH: 408,
    draw(ctx, w, h, t) {
      // faint inner fill
      ctx.fillStyle = 'rgba(12,10,22,0.32)';
      rr(ctx, 8, 8, w - 16, h - 16, 60);
      ctx.fill();
      border(ctx, w, h, { inset: 8, radius: 60, lw: 5 });

      // typed prompt
      const typedP = seg(t, 0.35, 1.85, (k) => k);
      const n = Math.floor(PROMPT.length * clamp(typedP));
      const shown = PROMPT.slice(0, n);
      const tx = 72, ty = h / 2;
      text(ctx, shown, tx, ty, { size: 88, weight: 500, color: WHITE, baseline: 'middle' });

      // caret
      ctx.font = `500 88px ${FONT}`;
      const tw = ctx.measureText(shown).width;
      const blink = t < 1.85 ? (t * 2.2) % 1 < 0.62 : (t * 1.8) % 1 < 0.55;
      caret(ctx, tx + tw + 10, ty - 48, 96, blink, ACCENT);

      // send button (round, lights up ~1.9–2.15)
      const lit = seg(t, 1.88, 2.15, easeOutCubic);
      const bx = w - 128, by = h / 2;
      if (lit > 0) glow(ctx, bx, by, 120, `rgba(255,138,76,${0.5 * lit})`);
      const g = ctx.createLinearGradient(bx - 62, by - 62, bx + 62, by + 62);
      g.addColorStop(0, lit > 0.05 ? '#ff9c60' : 'rgba(255,255,255,0.18)');
      g.addColorStop(1, lit > 0.05 ? '#ff7a2c' : 'rgba(255,255,255,0.10)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, 62, 0, Math.PI * 2);
      ctx.fill();
      // arrow (points right)
      ctx.strokeStyle = lit > 0.05 ? '#fff' : 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(bx - 26, by);
      ctx.lineTo(bx + 22, by);
      ctx.moveTo(bx + 4, by - 18);
      ctx.lineTo(bx + 22, by);
      ctx.lineTo(bx + 4, by + 18);
      ctx.stroke();
    },
    material: makeGlass({ transmission: 0.88, roughness: 0.38, thickness: 0.5 }),
  });
  chat.group.position.set(-0.15, 0.42, 0.42);
  chat.group.rotation.y = 0.03;
  group.add(chat.group);
  panels.push(chat);

  // --- reply bubble ---
  const reply = makePanel({
    w: 3.35, h: 1.12, d: 0.16, r: 0.32,
    faceW: 1340, faceH: 448,
    draw(ctx, w, h, t) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      rr(ctx, 8, 8, w - 16, h - 16, 52);
      ctx.fill();
      border(ctx, w, h, { inset: 8, radius: 52, lw: 5, alpha: 0.75 });

      const dotsP = seg(t, 2.02, 2.5);
      const textP = seg(t, 2.52, 2.92, easeOutCubic);

      if (textP <= 0.02) {
        // typing dots (bouncing)
        const cy = h / 2;
        for (let i = 0; i < 3; i++) {
          const phase = Math.sin((t * 3.6) - i * 0.85);
          const dy = phase * 14 * dotsP;
          const a = 0.35 + 0.65 * dotsP;
          dot(ctx, w / 2 - 82 + i * 82, cy + dy, 17, `rgba(255,255,255,${a})`);
        }
      } else {
        // reply text slides + fades in
        ctx.save();
        const dy = (1 - textP) * 16;
        text(ctx, REPLY, w / 2, h / 2 + dy, {
          size: 78, weight: 500, color: WHITE, align: 'center', baseline: 'middle', alpha: textP,
        });
        ctx.restore();
      }
    },
    material: makeGlass({ transmission: 0.9, roughness: 0.4, thickness: 0.5 }),
  });
  reply.group.position.set(0.95, -1.18, 0.55);
  reply.group.rotation.y = -0.07;
  group.add(reply.group);
  panels.push(reply);

  return {
    group,
    update(t) {
      for (const p of panels) p.redraw(t);
    },
  };
}
