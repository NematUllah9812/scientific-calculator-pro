import * as THREE from 'three';
import { makePanel, makeGlass } from '../panels.js';
import { text, border, checkmark, flame, dot, glow, rr, strike, ACCENT, WHITE, GREEN, FONT } from '../ui.js';
import { stageGroup, makeStageLabel } from './common.js';
import { norm, clamp, seg, easeOutCubic, easeOutBack, easeOutExpo, lerp, smoothstep } from '../timeline.js';
import { mulberry32, rngRange } from '../rand.js';

// Scene 4 "Ship it" (10–12.5s):
// glass phone swings in with the finished habit app. Streak counter counts up to 12,
// habits check off, bar chart grows, instanced confetti burst falls under gravity.

const HABITS = ['Morning run', 'Read 20 min', 'Push-ups'];
const BARS = [0.45, 0.62, 0.5, 0.78, 0.92, 0.68, 1.0];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const CONFETTI_N = 240;
const CONFETTI_SPAWN = 11.52;
const GRAVITY = -3.4;

export function buildShip(scene) {
  const group = stageGroup(3);
  scene.add(group);
  const panels = [];

  const label = makeStageLabel(3, 'STEP 04', 'SHIP', makePanel, { y: 2.87 });
  group.add(label.group);
  panels.push(label);

  // ---- phone ----
  const phone = makePanel({
    w: 2.1, h: 4.25, d: 0.2, r: 0.4,
    faceW: 760, faceH: 1538,
    draw(ctx, w, h, t) {
      // screen fill
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, 'rgba(16,14,28,0.82)');
      bg.addColorStop(1, 'rgba(22,16,36,0.72)');
      ctx.fillStyle = bg;
      rr(ctx, 8, 8, w - 16, h - 16, 64);
      ctx.fill();
      border(ctx, w, h, { inset: 8, radius: 64, lw: 6 });

      // status bar
      text(ctx, '9:41', 64, 92, { size: 40, weight: 700, color: WHITE });
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      rr(ctx, w - 128, 68, 62, 28, 8);
      ctx.fill();
      ctx.fillRect(w - 128, 68, 42, 28);

      // header
      text(ctx, 'HABIT STREAK', w / 2, 196, {
        size: 38, weight: 700, color: 'rgba(255,255,255,0.6)', align: 'center', tracking: 10,
      });

      // streak counter (counts up to 12)
      const countP = seg(t, 10.38, 11.28, easeOutCubic);
      const streak = Math.round(lerp(0, 12, countP));
      const cx = w / 2, cy = 330;
      glow(ctx, cx, cy, 170, `rgba(255,138,76,${0.22 + 0.12 * countP})`);
      flame(ctx, cx - 128, cy - 6, 52, ACCENT, 0.35 + 0.65 * countP);
      text(ctx, `${streak}`, cx + 12, cy + 30, {
        size: 150, weight: 800, color: WHITE, align: 'center', baseline: 'middle',
      });
      text(ctx, 'DAY STREAK', cx + 12, cy + 122, {
        size: 34, weight: 700, color: ACCENT, align: 'center', tracking: 8,
      });

      // habit rows
      for (let i = 0; i < 3; i++) {
        const y = 560 + i * 128;
        const done = seg(t, 10.66 + i * 0.24, 10.94 + i * 0.24, easeOutCubic);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, 48, y - 46, w - 96, 100, 26);
        ctx.fill();
        // checkbox
        const bx = 112, by = y + 4;
        ctx.fillStyle = done > 0.05 ? '#ff8a4c' : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(bx, by, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 4;
        ctx.stroke();
        checkmark(ctx, bx, by, 42, done, { color: '#fff', lw: 7 });
        text(ctx, HABITS[i], 172, by, {
          size: 46, weight: 600, color: WHITE, baseline: 'middle', alpha: 1 - done * 0.35,
        });
      }

      // bar chart grows
      const chartY = 1120, chartH = 240;
      text(ctx, 'THIS WEEK', 64, 950, {
        size: 32, weight: 700, color: 'rgba(255,255,255,0.55)', tracking: 8,
      });
      for (let i = 0; i < 7; i++) {
        const p = seg(t, 11.02 + i * 0.1, 11.52 + i * 0.1, easeOutCubic);
        const bw = 52, gap = 32;
        const x = 64 + i * (bw + gap);
        const bh = BARS[i] * chartH * p;
        const g = ctx.createLinearGradient(0, chartY - bh, 0, chartY);
        g.addColorStop(0, '#ff9c60');
        g.addColorStop(1, 'rgba(255,122,44,0.45)');
        ctx.fillStyle = g;
        rr(ctx, x, chartY - bh, bw, bh, 14);
        ctx.fill();
        text(ctx, DAYS[i], x + bw / 2, chartY + 56, {
          size: 30, weight: 600, color: 'rgba(255,255,255,0.5)', align: 'center',
        });
      }
    },
    material: makeGlass({
      transmission: 0.72, roughness: 0.32, thickness: 0.55,
      color: 0xcfd4ff, attenuationColor: 0x3a3466, attenuationDistance: 1.6,
    }),
  });
  phone.group.position.set(0.05, 0.0, 0.42);
  group.add(phone.group);
  panels.push(phone);

  // ---- instanced confetti ----
  const confettiGeo = new THREE.PlaneGeometry(0.1, 0.15);
  const confettiMat = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide, toneMapped: false, transparent: true, opacity: 0.95,
  });
  const confetti = new THREE.InstancedMesh(confettiGeo, confettiMat, CONFETTI_N);
  confetti.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(confetti);

  const rng = mulberry32(98765);
  const pieces = [];
  const palette = [
    new THREE.Color(1.0, 0.54, 0.30), new THREE.Color(1.0, 0.78, 0.45),
    new THREE.Color(0.55, 0.42, 1.0), new THREE.Color(1.0, 0.42, 0.62),
    new THREE.Color(0.95, 0.95, 1.0), new THREE.Color(0.35, 0.65, 1.0),
  ];
  for (let i = 0; i < CONFETTI_N; i++) {
    const theta = rng() * Math.PI * 2;
    const speed = rngRange(rng, 0.9, 2.4);
    pieces.push({
      p0: new THREE.Vector3(rngRange(rng, -1.0, 1.0), rngRange(rng, 1.85, 2.65), rngRange(rng, -0.3, 1.0)),
      v0: new THREE.Vector3(Math.cos(theta) * speed * 0.75, rngRange(rng, 1.1, 2.6), Math.sin(theta) * speed * 0.75),
      rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
      spin: new THREE.Vector3(rngRange(rng, -6, 6), rngRange(rng, -6, 6), rngRange(rng, -6, 6)),
      scale: rngRange(rng, 0.7, 1.5),
    });
    confetti.setColorAt(i, palette[i % palette.length]);
  }
  confetti.instanceColor.needsUpdate = true;

  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const S = new THREE.Vector3();
  const P = new THREE.Vector3();
  const E = new THREE.Euler();

  return {
    group,
    update(t) {
      for (const p of panels) p.redraw(t);

      // phone swing-in: yaw from side, settles with slight overshoot
      const swing = seg(t, 9.98, 10.72, (k) => easeOutBack(k, 1.35));
      phone.group.rotation.y = lerp(-1.18, -0.16, swing);
      phone.group.rotation.z = lerp(0.22, 0.02, swing);
      phone.group.position.x = lerp(1.9, 0.05, seg(t, 9.98, 10.72, easeOutExpo));
      phone.group.position.y = 0.0 + Math.sin(t * 0.7) * 0.03;

      // confetti ballistic (closed form in t — deterministic under random seeks)
      const tau = t - CONFETTI_SPAWN;
      for (let i = 0; i < CONFETTI_N; i++) {
        const pc = pieces[i];
        if (tau <= 0) {
          M.makeScale(0, 0, 0);
          confetti.setMatrixAt(i, M);
          continue;
        }
        const tt = Math.min(tau, 3.2);
        P.set(
          pc.p0.x + pc.v0.x * tt,
          pc.p0.y + pc.v0.y * tt + 0.5 * GRAVITY * tt * tt,
          pc.p0.z + pc.v0.z * tt,
        );
        E.set(
          pc.rot.x + pc.spin.x * tt,
          pc.rot.y + pc.spin.y * tt,
          pc.rot.z + pc.spin.z * tt,
        );
        Q.setFromEuler(E);
        const fade = tau > 2.6 ? clamp((3.2 - tau) / 0.6) : 1;
        S.setScalar(pc.scale * fade * 1.15);
        M.compose(P, Q, S);
        confetti.setMatrixAt(i, M);
      }
      confetti.instanceMatrix.needsUpdate = true;
      confetti.visible = tau > 0;
    },
  };
}
