import * as THREE from 'three';
import { WIDTH, HEIGHT, FPS, DURATION, clamp } from './timeline.js';
import { buildWorld } from './world.js';
import { buildTube } from './tube.js';
import { computeCameraPathSamples, buildCamera } from './camera.js';
import { buildPost } from './postfx.js';
import { buildDescribe } from './scenes/describe.js';
import { buildPlan } from './scenes/plan.js';
import { buildBuild } from './scenes/build.js';
import { buildShip } from './scenes/ship.js';
import { buildOverlay } from './scenes/overlay.js';

// Deterministic motion-graphics explainer: "From idea to app with Claude Code".
// Every animation is a pure function of t (seconds). window.__explainer.seek(t) renders frame t.

async function loadFonts() {
  const faces = [
    ['Inter', 400, '/node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2'],
    ['Inter', 500, '/node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2'],
    ['Inter', 600, '/node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2'],
    ['Inter', 700, '/node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2'],
    ['Inter', 800, '/node_modules/@fontsource/inter/files/inter-latin-800-normal.woff2'],
    ['JBMono', 400, '/node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'],
    ['JBMono', 500, '/node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2'],
  ];
  await Promise.all(faces.map(async ([family, weight, url]) => {
    const font = new FontFace(family, `url(${url})`, { weight: String(weight) });
    await font.load();
    document.fonts.add(font);
  }));
  await document.fonts.ready;
}

async function boot() {
  await loadFonts();

  const canvas = document.getElementById('stage');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0816, 0.0105);
  const camera = new THREE.PerspectiveCamera(42, WIDTH / HEIGHT, 0.1, 260);
  scene.add(camera); // camera-space overlays are children of the camera

  const pathSamples = computeCameraPathSamples();
  const world = buildWorld(scene, renderer, pathSamples);
  const tube = buildTube(scene);
  const s1 = buildDescribe(scene);
  const s2 = buildPlan(scene);
  const s3 = buildBuild(scene);
  const s4 = buildShip(scene);
  const cam = buildCamera(camera);
  const overlay = buildOverlay(camera);
  const post = buildPost(renderer, scene, camera);

  function seek(t) {
    const tt = clamp(t, 0, DURATION);
    world.update(tt);
    tube.update(tt);
    s1.update(tt);
    s2.update(tt);
    s3.update(tt);
    s4.update(tt);
    cam.update(tt);
    overlay.update(tt);
    post.update(tt);
    post.render();
    return tt;
  }

  window.__explainer = {
    ready: true,
    duration: DURATION,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    seek,
    frame: (i) => seek(i / FPS),
  };

  // preview mode: rAF playback (?freeze=1 for a still at ?t=)
  const params = new URLSearchParams(location.search);
  const freeze = params.has('freeze');
  const startT = parseFloat(params.get('t') ?? '0') || 0;
  if (freeze) {
    seek(startT);
  } else {
    const t0 = performance.now() / 1000 - startT;
    const loop = () => {
      const t = ((performance.now() / 1000 - t0) % DURATION);
      seek(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

boot().catch((e) => {
  console.error(e);
  window.__explainer = { ready: false, error: String(e) };
});
