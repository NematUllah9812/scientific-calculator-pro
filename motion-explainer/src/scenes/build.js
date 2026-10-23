import * as THREE from 'three';
import { makePanel, makeGlass } from '../panels.js';
import { text, border, dot, glow, rr, checkmark, ACCENT, WHITE, GREEN, FONT } from '../ui.js';
import { stageGroup, makeStageLabel } from './common.js';
import { norm, clamp, seg, easeOutCubic, easeOutBack, lerp, smoothstep } from '../timeline.js';

// Scene 3 "Build it" (6–9.5s):
// dark glass code editor (window dots + tabs) types a React component with syntax colours,
// six glass file-name tiles orbit it in 3D, ends with a green "✓ 12 tests passed" badge.

// code tokens: [text, colorKey]
const K = '#c4b5fd';   // keyword violet
const T = '#7dd3fc';   // tag/component blue
const S = '#ff8a4c';   // string / attribute accent
const P = '#f0abfc';   // prop pink
const N = '#e5e7eb';   // plain
const C = '#6b7280';   // comment/punct
const G = '#86efac';   // number-ish green

const CODE_LINES = [
  [['export ', K], ['function ', K], ['HabitCard', T], ['({ ', C], ['habit', P], [' }) {', C]],
  [['  const ', K], ['streak', N], [' = ', C], ['useStreak', T], ['(', C], ['habit', P], ['.id)', C]],
  [['  return ', K], ['(', C]],
  [['    <', C], ['Card', T], [' done', P], ['={', C], ['habit', P], ['.done} ', C], ['glow', P], ['>', C]],
  [['      <', C], ['Flame', T], [' days', P], ['={', C], ['streak', N], ['} />', C]],
  [['      <', C], ['span', T], ['>{', C], ['habit', P], ['.name}</', C], ['span', T], ['>', C]],
  [['    </', C], ['Card', T], ['>', C]],
  [['  )', C]],
  [['}', C]],
];

const TABS = ['HabitCard.tsx', 'streak.ts', 'useHabits.ts'];
const TILES = ['App.tsx', 'streak.ts', 'HabitCard.tsx', 'useHabits.ts', 'chart.tsx', 'theme.css'];

function codeTextUpTo(chars) {
  // returns list of {line, segs:[{str,color}]} revealing `chars` characters total
  let left = chars;
  const out = [];
  for (const line of CODE_LINES) {
    const segs = [];
    let lineDone = true;
    for (const [str, color] of line) {
      if (left <= 0) { lineDone = false; break; }
      const take = Math.min(str.length, left);
      segs.push({ str: str.slice(0, take), color });
      left -= take;
      if (take < str.length) { lineDone = false; break; }
    }
    out.push({ segs, complete: lineDone });
    if (left <= 0 && !lineDone) break;
    if (left <= 0) break;
  }
  return out;
}

export function buildBuild(scene) {
  const group = stageGroup(2);
  scene.add(group);
  const panels = [];

  const label = makeStageLabel(2, 'STEP 03', 'BUILD', makePanel);
  group.add(label.group);
  panels.push(label);

  // ---- editor slab (dark glass) ----
  const editor = makePanel({
    w: 5.55, h: 3.45, d: 0.2, r: 0.18,
    faceW: 1920, faceH: 1194,
    draw(ctx, w, h, t) {
      // dark glass fill
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, 'rgba(10,10,18,0.78)');
      bg.addColorStop(1, 'rgba(14,12,26,0.66)');
      ctx.fillStyle = bg;
      rr(ctx, 6, 6, w - 12, h - 12, 26);
      ctx.fill();
      border(ctx, w, h, { inset: 6, radius: 26, lw: 5, alpha: 0.8 });

      // window dots
      const dy = 64;
      dot(ctx, 62, dy, 15, '#ff5f57');
      dot(ctx, 108, dy, 15, '#febc2e');
      dot(ctx, 154, dy, 15, '#28c840');

      // tabs
      let tx = 232;
      for (let i = 0; i < TABS.length; i++) {
        const active = i === 0;
        ctx.font = `600 44px ${FONT}`;
        const tw = ctx.measureText(TABS[i]).width;
        if (active) {
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          rr(ctx, tx - 18, 28, tw + 36, 72, 16);
          ctx.fill();
          ctx.fillStyle = ACCENT;
          rr(ctx, tx - 18, 28, tw + 36, 6, 3);
          ctx.fill();
        }
        text(ctx, TABS[i], tx, dy + 16, {
          size: 44, weight: 600, color: active ? WHITE : 'rgba(255,255,255,0.38)', baseline: 'middle',
        });
        tx += tw + 62;
      }
      // divider
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, 128); ctx.lineTo(w - 30, 128);
      ctx.stroke();

      // typed code
      const typeP = seg(t, 6.35, 8.55, (k) => k);
      const totalChars = CODE_LINES.reduce((a, l) => a + l.reduce((b, s) => b + s[0].length, 0), 0);
      const chars = Math.floor(totalChars * typeP);
      const lines = codeTextUpTo(chars);

      const lineH = 96;
      const x0 = 108, y0 = 218;
      for (let i = 0; i < lines.length; i++) {
        const y = y0 + i * lineH;
        text(ctx, `${i + 1}`, 62, y, { size: 40, weight: 500, color: 'rgba(255,255,255,0.28)', baseline: 'middle' });
        let x = x0;
        ctx.font = `500 52px "JBMono", ${FONT}`;
        ctx.textBaseline = 'middle';
        for (const seg2 of lines[i].segs) {
          ctx.fillStyle = seg2.color;
          ctx.fillText(seg2.str, x, y);
          x += ctx.measureText(seg2.str).width;
        }
      }

      // caret at typing position
      if (typeP < 1 && (t * 2.4) % 1 < 0.62) {
        const li = Math.max(0, lines.length - 1);
        const last = lines[li];
        let x = x0;
        ctx.font = `500 52px "JBMono", ${FONT}`;
        for (const s2 of last.segs) x += ctx.measureText(s2.str).width;
        ctx.fillStyle = ACCENT;
        ctx.fillRect(x + 6, y0 + li * lineH - 30, 8, 60);
      }
    },
    material: makeGlass({
      transmission: 0.55, roughness: 0.34, thickness: 0.7,
      color: 0x8a86b8, attenuationColor: 0x2a2440, attenuationDistance: 1.2, clearcoat: 0.6,
    }),
  });
  editor.group.position.set(0, 0.05, 0.35);
  group.add(editor.group);
  panels.push(editor);

  // ---- six orbiting file-name tiles ----
  const tiles = [];
  for (let i = 0; i < 6; i++) {
    const tile = makePanel({
      w: 1.18, h: 0.4, d: 0.1, r: 0.14,
      faceW: 640, faceH: 210,
      draw(ctx, w, h, t) {
        ctx.fillStyle = 'rgba(12,10,22,0.30)';
        rr(ctx, 6, 6, w - 12, h - 12, 28);
        ctx.fill();
        border(ctx, w, h, { inset: 6, radius: 28, lw: 4, alpha: 0.8 });
        // file dot
        dot(ctx, 52, h / 2, 11, i % 2 ? ACCENT : 'rgba(255,255,255,0.85)');
        text(ctx, TILES[i], 92, h / 2, {
          size: 62, weight: 600, color: WHITE, baseline: 'middle',
        });
      },
      material: makeGlass({ transmission: 0.85, roughness: 0.38, thickness: 0.35 }),
    });
    group.add(tile.group);
    panels.push(tile);
    tiles.push({ tile, i, phase: (i / 6) * Math.PI * 2 });
  }

  // ---- test badge ----
  const badge = makePanel({
    w: 2.55, h: 0.68, d: 0.12, r: 0.3,
    faceW: 1120, faceH: 300,
    draw(ctx, w, h, t) {
      const p = seg(t, 8.82, 9.18, easeOutCubic);
      ctx.fillStyle = 'rgba(20,40,24,0.5)';
      rr(ctx, 6, 6, w - 12, h - 12, 46);
      ctx.fill();
      ctx.strokeStyle = 'rgba(74,222,128,0.9)';
      ctx.lineWidth = 6;
      rr(ctx, 6, 6, w - 12, h - 12, 46);
      ctx.stroke();
      if (p > 0.05) glow(ctx, 120, h / 2, 110, `rgba(74,222,128,${0.35 * p})`);
      checkmark(ctx, 118, h / 2, 88, seg(t, 8.86, 9.14, easeOutCubic), { color: GREEN, lw: 13 });
      text(ctx, '12 tests passed', 208, h / 2, {
        size: 74, weight: 700, color: GREEN, baseline: 'middle', alpha: p,
      });
    },
    material: makeGlass({ transmission: 0.8, roughness: 0.36, thickness: 0.4, color: 0xbfffd9 }),
  });
  badge.group.position.set(1.62, -1.62, 0.55);
  badge.group.rotation.y = -0.12;
  group.add(badge.group);
  panels.push(badge);

  return {
    group,
    update(t) {
      for (const p of panels) p.redraw(t);
      // orbit motion (flatter ring behind the editor so tiles stay readable)
      for (const o of tiles) {
        const ang = t * 0.42 + o.phase;
        const rx = 4.0, rz = 0.75;
        o.tile.group.position.set(
          Math.cos(ang) * rx,
          0.35 + Math.sin(t * 0.55 + o.phase * 1.7) * 0.62,
          -0.55 + Math.sin(ang) * rz,
        );
        o.tile.group.rotation.y = -ang + Math.PI / 2;
      }
      // badge pop
      const pop = seg(t, 8.82, 9.24, (k) => easeOutBack(k, 2.2));
      badge.group.scale.setScalar(lerp(0.55, 1, clamp(pop)));
      badge.group.visible = t > 8.75;
    },
  };
}
