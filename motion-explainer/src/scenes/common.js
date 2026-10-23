import * as THREE from 'three';
import { STAGES } from '../camera.js';
import { text, border, ACCENT, WHITE } from '../ui.js';

// Shared helpers for the four story stages.

// Big scene label: orange "STEP 0X" above a large white word.
export function makeStageLabel(stageIndex, stepText, word, panelFactory, opts = {}) {
  const y = opts.y ?? 2.42;
  const panel = panelFactory({
    w: 3.15, h: 1.22, d: 0.12, r: 0.2,
    faceW: 1200, faceH: 466,
    draw(ctx, w, h, t) {
      border(ctx, w, h, { inset: 10, radius: 44, lw: 6, alpha: 0.55 });
      text(ctx, stepText, w / 2, h * 0.36, {
        size: 86, weight: 800, color: ACCENT, align: 'center', tracking: 24,
      });
      text(ctx, word, w / 2, h * 0.8, {
        size: 132, weight: 800, color: WHITE, align: 'center', tracking: 5,
      });
    },
  });
  panel.group.position.set(0, y, -0.95);
  panel.group.rotation.x = -0.04;
  return panel;
}

// Attach a stage group to the world with the stage's position + yaw.
export function stageGroup(index) {
  const g = new THREE.Group();
  const st = STAGES[index];
  g.position.copy(st.pos);
  g.rotation.y = st.yaw;
  return g;
}
