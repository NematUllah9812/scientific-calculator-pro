import * as THREE from 'three';
import { mulberry32, rngRange } from './rand.js';
import { makeGlass } from './panels.js';

// Big gradient dome (violet / orange / blue / pink blobs on dark space),
// matching equirect env map for glass reflections, lights, and scattered glass/glow objects.

const DOME_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DOME_FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform float uT;
  vec3 blob(vec3 d, vec3 dir, vec3 color, float power, float gain) {
    float f = pow(max(dot(d, normalize(dir)), 0.0), power);
    return color * f * gain;
  }
  void main() {
    vec3 d = normalize(vDir);
    vec3 col = vec3(0.0075, 0.0065, 0.014);
    float t = uT;
    col += blob(d, vec3( 0.55 + 0.08*sin(t*0.13),  0.38 + 0.05*cos(t*0.11),  0.62), vec3(0.165, 0.085, 0.36), 2.2, 0.52); // violet
    col += blob(d, vec3(-0.62 + 0.07*cos(t*0.09),  0.16,  0.52 + 0.06*sin(t*0.10)), vec3(0.42, 0.135, 0.045), 2.6, 0.46); // orange
    col += blob(d, vec3( 0.12, -0.35, -0.85 + 0.05*cos(t*0.08)), vec3(0.045, 0.10, 0.34), 2.3, 0.48);  // blue
    col += blob(d, vec3(-0.52 + 0.05*sin(t*0.12), -0.22, -0.62), vec3(0.30, 0.055, 0.155), 2.5, 0.40); // pink
    col += blob(d, vec3( 0.35,  0.62, -0.35), vec3(0.10, 0.05, 0.22), 3.0, 0.34);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildWorld(scene, renderer, cameraPathSamples = []) {
  // ---- dome ----
  const domeMat = new THREE.ShaderMaterial({
    vertexShader: DOME_VERT,
    fragmentShader: DOME_FRAG,
    uniforms: { uT: { value: 0 } },
    side: THREE.BackSide,
    depthWrite: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(110, 48, 32), domeMat);
  dome.position.set(0, 0, -25);
  scene.add(dome);

  // ---- equirect env (static, for glass reflections) ----
  const envCanvas = document.createElement('canvas');
  envCanvas.width = 1024; envCanvas.height = 512;
  const ex = envCanvas.getContext('2d');
  const bg = ex.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#141020');
  bg.addColorStop(0.5, '#0a0812');
  bg.addColorStop(1, '#060409');
  ex.fillStyle = bg;
  ex.fillRect(0, 0, 1024, 512);
  const blobs = [
    [200, 170, 260, '#5b34c9', 0.55], [430, 140, 220, '#ff8a4c', 0.5],
    [700, 220, 250, '#2c56d9', 0.5], [880, 150, 200, '#d9417f', 0.45],
    [330, 320, 190, '#7a4bd9', 0.32], [600, 330, 210, '#ff8a4c', 0.3],
  ];
  for (const [x, y, r, c, a] of blobs) {
    const g = ex.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ex.save();
    ex.globalAlpha = a;
    ex.fillStyle = g;
    ex.fillRect(x - r, y - r, r * 2, r * 2);
    ex.restore();
  }
  const envTex = new THREE.CanvasTexture(envCanvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromEquirectangular(envTex);
  scene.environment = envRT.texture;
  pmrem.dispose();

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0x241a3a, 1.0));
  const key = new THREE.DirectionalLight(0xffe2c8, 1.55);
  key.position.set(6, 9, 8);
  scene.add(key);
  const violet = new THREE.PointLight(0x7744ff, 170, 60, 1.8);
  violet.position.set(-10, 6, -12);
  scene.add(violet);
  const orange = new THREE.PointLight(0xff8a4c, 150, 55, 1.8);
  orange.position.set(12, 2, -24);
  scene.add(orange);
  const pink = new THREE.PointLight(0xff4f9a, 120, 55, 1.8);
  pink.position.set(-6, -2, -40);
  scene.add(pink);

  // ---- scattered clear glass shapes + glowing orbs ----
  const rng = mulberry32(20261023);
  const scatter = new THREE.Group();
  scene.add(scatter);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.96,
    roughness: 0.12,
    thickness: 1.1,
    ior: 1.5,
    iridescence: 0.55,
    iridescenceIOR: 1.32,
    dispersion: 4.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.15,
  });

  const geos = [
    new THREE.SphereGeometry(1, 24, 18),
    new THREE.TorusGeometry(0.85, 0.1, 12, 40),
    new THREE.IcosahedronGeometry(0.85, 0),
  ];

  // camera path samples (filled by camera.js before scatter placement)
  const stageAvoid = [
    { p: new THREE.Vector3(0, 0.7, 0), r: 5.8 },
    { p: new THREE.Vector3(12.5, 3.3, -18), r: 5.8 },
    { p: new THREE.Vector3(-9.5, -0.7, -34), r: 5.8 },
    { p: new THREE.Vector3(7, 5.6, -51), r: 5.8 },
  ];

  function farEnough(p, minCam = 4.6) {
    for (const s of stageAvoid) if (p.distanceTo(s.p) < s.r) return false;
    for (const c of cameraPathSamples) if (p.distanceTo(c) < minCam) return false;
    return true;
  }

  const scatterItems = [];
  for (let i = 0; i < 30; i++) {
    const geo = geos[i % 3];
    const mesh = new THREE.Mesh(geo, glassMat);
    let p = null;
    for (let tries = 0; tries < 200; tries++) {
      const cand = new THREE.Vector3(
        rngRange(rng, -26, 26),
        rngRange(rng, -10, 14),
        rngRange(rng, -72, 14),
      );
      if (farEnough(cand)) { p = cand; break; }
    }
    if (!p) continue;
    mesh.position.copy(p);
    const s = rngRange(rng, 0.32, 0.95);
    mesh.scale.setScalar(s);
    mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
    scatter.add(mesh);
    scatterItems.push({
      mesh,
      spin: rngRange(rng, -0.22, 0.22),
      phase: rng() * Math.PI * 2,
      baseRot: mesh.rotation.clone(),
    });
  }

  // glowing orbs (small emissive spheres) for parallax + bloom sparkle
  const orbColors = [
    new THREE.Color(2.6, 1.5, 0.85), // warm
    new THREE.Color(1.3, 1.0, 2.8),  // violet
    new THREE.Color(1.0, 1.45, 2.6), // ice blue
    new THREE.Color(2.6, 1.0, 1.6),  // pink
    new THREE.Color(2.4, 2.2, 1.9),  // white
  ];
  const orbs = [];
  for (let i = 0; i < 26; i++) {
    const r = rngRange(rng, 0.05, 0.13);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 8),
      new THREE.MeshBasicMaterial({ color: orbColors[i % orbColors.length], toneMapped: false }),
    );
    let p = null;
    for (let tries = 0; tries < 200; tries++) {
      const cand = new THREE.Vector3(
        rngRange(rng, -24, 24),
        rngRange(rng, -8, 12),
        rngRange(rng, -68, 12),
      );
      if (farEnough(cand, 3.4)) { p = cand; break; }
    }
    if (!p) continue;
    mesh.position.copy(p);
    scatter.add(mesh);
    orbs.push({
      mesh, phase: rng() * Math.PI * 2, amp: rngRange(rng, 0.1, 0.35),
      speed: rngRange(rng, 0.25, 0.6), baseY: p.y,
    });
  }

  return {
    dome,
    cameraPathSamples,
    update(t) {
      domeMat.uniforms.uT.value = t;
      // absolute, t-driven rotation & drift (deterministic under random seeks)
      for (const it of scatterItems) {
        it.mesh.rotation.y = it.baseRot.y + it.spin * t;
        it.mesh.rotation.x = it.baseRot.x + it.spin * 0.5 * t;
      }
      for (const o of orbs) {
        o.mesh.position.y = o.baseY + Math.sin(t * o.speed + o.phase) * o.amp;
      }
    },
  };
}
