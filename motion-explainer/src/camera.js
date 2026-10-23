import * as THREE from 'three';
import { CAM, norm, easeInOutExpo, easeOutExpo, smoothstep } from './timeline.js';

// Camera flies through 4 scenes: slow drift inside each shot, expo-ease whips between.
// Scene 5 pulls back to a wide shot of everything. All transforms are pure functions of t.

export const STAGES = [
  { pos: new THREE.Vector3(0, 0.35, 0), yaw: 0.0, camDist: 7.0 },
  { pos: new THREE.Vector3(12.5, 2.9, -18), yaw: -0.42, camDist: 7.0 },
  { pos: new THREE.Vector3(-9.5, -1.1, -34), yaw: 0.34, camDist: 7.0 },
  { pos: new THREE.Vector3(7, 5.2, -51), yaw: -0.26, camDist: 8.2 },
];

export const REVEAL_CAM = {
  pos: new THREE.Vector3(11, 9, 23),
  target: new THREE.Vector3(1, 1.8, -28),
};

const LOCAL_CAM = new THREE.Vector3(0, 0.5, 7.0);
const LOCAL_TARGET = new THREE.Vector3(0, 0.45, 0);

function stageCamPos(stage, out) {
  const s = Math.sin(stage.yaw), c = Math.cos(stage.yaw);
  const dz = stage.camDist ?? 7.0;
  out.set(
    stage.pos.x + LOCAL_CAM.x * c + dz * s,
    stage.pos.y + LOCAL_CAM.y,
    stage.pos.z - LOCAL_CAM.x * s + dz * c,
  );
  return out;
}

function stageTarget(stage, out) {
  const s = Math.sin(stage.yaw), c = Math.cos(stage.yaw);
  out.set(
    stage.pos.x + LOCAL_TARGET.x * c + LOCAL_TARGET.z * s,
    stage.pos.y + LOCAL_TARGET.y,
    stage.pos.z - LOCAL_TARGET.x * s + LOCAL_TARGET.z * c,
  );
  return out;
}

const DRIFT_A = 0.16, DRIFT_B = 0.11, DRIFT_C = 0.075;

function drift(i, t, pos, target) {
  const phi = i * 1.7;
  pos.x += Math.sin(t * 0.42 + phi) * DRIFT_A;
  pos.y += Math.cos(t * 0.33 + phi * 1.3) * DRIFT_B;
  pos.z += Math.sin(t * 0.27 + phi * 0.7) * DRIFT_C;
  target.x += Math.sin(t * 0.21 + phi + 1.1) * DRIFT_A * 0.45;
  target.y += Math.cos(t * 0.19 + phi) * DRIFT_B * 0.5;
}

const V = {
  a: new THREE.Vector3(), b: new THREE.Vector3(),
  ta: new THREE.Vector3(), tb: new THREE.Vector3(),
};

function bezier3(p0, p1, p2, k, out) {
  const u = 1 - k;
  out.set(
    u * u * p0.x + 2 * u * k * p1.x + k * k * p2.x,
    u * u * p0.y + 2 * u * k * p1.y + k * k * p2.y,
    u * u * p0.z + 2 * u * k * p1.z + k * k * p2.z,
  );
  return out;
}

const PULL_MID = new THREE.Vector3(17, 16, -8);

function shotTransform(i, t, pos, target) {
  stageCamPos(STAGES[i], pos);
  stageTarget(STAGES[i], target);
  drift(i, t, pos, target);
}

function sampleCameraPath(t, pos, target) {
  if (t < CAM.whip1[0]) {
    shotTransform(0, t, pos, target);
  } else if (t < CAM.whip1[1]) {
    const k = easeInOutExpo(norm(t, CAM.whip1[0], CAM.whip1[1]));
    shotTransform(0, CAM.whip1[0], V.a, V.ta);
    shotTransform(1, CAM.whip1[1], V.b, V.tb);
    pos.lerpVectors(V.a, V.b, k); target.lerpVectors(V.ta, V.tb, k);
  } else if (t < CAM.whip2[0]) {
    shotTransform(1, t, pos, target);
  } else if (t < CAM.whip2[1]) {
    const k = easeInOutExpo(norm(t, CAM.whip2[0], CAM.whip2[1]));
    shotTransform(1, CAM.whip2[0], V.a, V.ta);
    shotTransform(2, CAM.whip2[1], V.b, V.tb);
    pos.lerpVectors(V.a, V.b, k); target.lerpVectors(V.ta, V.tb, k);
  } else if (t < CAM.whip3[0]) {
    shotTransform(2, t, pos, target);
  } else if (t < CAM.whip3[1]) {
    const k = easeInOutExpo(norm(t, CAM.whip3[0], CAM.whip3[1]));
    shotTransform(2, CAM.whip3[0], V.a, V.ta);
    shotTransform(3, CAM.whip3[1], V.b, V.tb);
    pos.lerpVectors(V.a, V.b, k); target.lerpVectors(V.ta, V.tb, k);
  } else if (t < CAM.pullback[0]) {
    shotTransform(3, t, pos, target);
  } else if (t < CAM.pullback[1]) {
    const k = easeOutExpo(norm(t, CAM.pullback[0], CAM.pullback[1]));
    shotTransform(3, CAM.pullback[0], V.a, V.ta);
    bezier3(V.a, PULL_MID, REVEAL_CAM.pos, k, pos);
    target.lerpVectors(V.ta, REVEAL_CAM.target, smoothstep(k));
  } else {
    const k = norm(t, CAM.pullback[1], 15.5);
    pos.copy(REVEAL_CAM.pos);
    pos.x += k * 1.6 + Math.sin(t * 0.22) * 0.35;
    pos.y += k * 1.1 + Math.cos(t * 0.18) * 0.3;
    pos.z += k * 2.2;
    target.copy(REVEAL_CAM.target);
    target.y += Math.sin(t * 0.15) * 0.25;
  }
  return { pos, target };
}

// Precomputed path samples used to keep scatter away from the camera path.
export function computeCameraPathSamples(n = 300) {
  const out = [];
  const p = new THREE.Vector3(), tg = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    sampleCameraPath((i / n) * 15.4, p, tg);
    out.push(p.clone());
  }
  return out;
}

export function buildCamera(camera) {
  const lookTarget = new THREE.Vector3();
  return {
    update(t) {
      sampleCameraPath(t, camera.position, lookTarget);
      camera.lookAt(lookTarget);
    },
  };
}
