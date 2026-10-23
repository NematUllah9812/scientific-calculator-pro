import * as THREE from 'three';
import { norm, clamp, TUBE_PROGRESS, smoothstep } from './timeline.js';

// Glowing tube along a CatmullRom curve connecting all scenes.
// Draws on with story progress; a bright head + glow sprite leads it.

const POINTS = [
  [-8.5, 4.4, 7.5],
  [-3.2, 3.8, 2.6],
  [1.8, 4.2, -2.6],
  [6.4, 4.8, -8.5],
  [11.8, 6.8, -12.5],
  [13.4, 6.2, -19.5],
  [5.5, 4.6, -24],
  [-4.5, 3.2, -28.5],
  [-11.2, 2.8, -35],
  [-3, 6.5, -41],
  [5.2, 9.6, -47.5],
  [8.8, 9.2, -54],
  [12, 11.5, -61],
];

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,210,170,0.55)');
  g.addColorStop(1, 'rgba(255,160,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildTube(scene) {
  const curve = new THREE.CatmullRomCurve3(POINTS.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
  const tubularSegments = 420, radialSegments = 12;
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, 0.055, radialSegments, false);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.6, 1.45, 0.85),
    toneMapped: false,
    transparent: true,
    opacity: 0.95,
  });
  const tube = new THREE.Mesh(geometry, material);
  scene.add(tube);
  const totalIndices = geometry.index.count;

  // bright head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 2.6, 1.5), toneMapped: false }),
  );
  scene.add(head);
  const headGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: new THREE.Color(2.4, 1.5, 1.0),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  headGlow.scale.setScalar(1.15);
  scene.add(headGlow);

  return {
    curve,
    update(t) {
      const p = smoothstep(norm(t, TUBE_PROGRESS[0], TUBE_PROGRESS[1]));
      const count = Math.max(6, Math.floor((totalIndices * clamp(p)) / 6) * 6);
      geometry.setDrawRange(0, count);
      const hp = curve.getPointAt(clamp(p, 0, 1));
      head.position.copy(hp);
      headGlow.position.copy(hp);
      const pulse = 1 + 0.12 * Math.sin(t * 4.2);
      head.scale.setScalar(pulse);
      headGlow.scale.setScalar(1.15 * pulse);
      head.visible = headGlow.visible = p > 0.002 && p < 0.9995;
      material.opacity = 0.95;
    },
  };
}
