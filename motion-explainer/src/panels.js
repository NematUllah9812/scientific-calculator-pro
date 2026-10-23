import * as THREE from 'three';
import { makeCanvas, clear } from './ui.js';

// Rounded rectangle shape → extruded slab (the frosted-glass panel body).
export function roundedSlabGeometry(w, h, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  const rad = Math.min(r, w / 2, h / 2);
  s.moveTo(x + rad, y);
  s.lineTo(x + w - rad, y);
  s.absarc(x + w - rad, y + rad, rad, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - rad);
  s.absarc(x + w - rad, y + h - rad, rad, 0, Math.PI / 2);
  s.lineTo(x + rad, y + h);
  s.absarc(x + rad, y + h - rad, rad, Math.PI / 2, Math.PI);
  s.lineTo(x, y + rad);
  s.absarc(x + rad, y + rad, rad, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.022,
    bevelSegments: 2, curveSegments: 12,
  });
  g.center();
  return g;
}

// Frosted glass (MeshPhysicalMaterial, transmission + roughness ~0.4).
export function makeGlass(opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: opts.color ?? 0xffffff,
    transmission: opts.transmission ?? 0.92,
    roughness: opts.roughness ?? 0.4,
    thickness: opts.thickness ?? 0.55,
    ior: opts.ior ?? 1.45,
    clearcoat: opts.clearcoat ?? 0.4,
    clearcoatRoughness: opts.clearcoatRoughness ?? 0.25,
    attenuationColor: new THREE.Color(opts.attenuationColor ?? 0xdfe4ff),
    attenuationDistance: opts.attenuationDistance ?? 2.5,
    envMapIntensity: opts.envMapIntensity ?? 1.0,
    metalness: 0,
  });
}

// A panel = glass slab + canvas-texture face plane, redrawn every frame via draw(ctx, w, h, t).
export function makePanel({
  w, h, d = 0.16, r = 0.22,
  faceW = 1024, faceH = 512,
  draw = null,
  material = null,
  faceY = 0,           // face plane offset along local +z
  faceScale = 1,
}) {
  const group = new THREE.Group();
  const geo = roundedSlabGeometry(w, h, d, r);
  const mat = material ?? makeGlass();
  const slab = new THREE.Mesh(geo, mat);
  group.add(slab);

  let face = null, texture = null, ctx = null, cw = 0, ch = 0;
  if (draw) {
    const c = makeCanvas(faceW, faceH);
    ctx = c.ctx; cw = c.w; ch = c.h;
    texture = new THREE.CanvasTexture(c.canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    const faceMat = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, toneMapped: false,
      depthWrite: false, side: THREE.FrontSide,
    });
    face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.985 * faceScale, h * 0.985 * faceScale), faceMat);
    face.position.z = d / 2 + 0.028 + faceY;
    face.renderOrder = 10;
    group.add(face);
    clear(ctx, cw, ch);
    draw(ctx, cw, ch, 0);
    texture.needsUpdate = true;
  }

  return {
    group, slab, face, texture, ctx, cw, ch,
    redraw(t) {
      if (!draw || !ctx) return;
      clear(ctx, cw, ch);
      draw(ctx, cw, ch, t);
      texture.needsUpdate = true;
    },
  };
}

// Camera-space overlay plane with a canvas texture (no glass).
export function makeCanvasPlane(w, h, faceW, faceH, draw) {
  const c = makeCanvas(faceW, faceH);
  const texture = new THREE.CanvasTexture(c.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, toneMapped: false, depthWrite: false, depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.renderOrder = 50;
  return {
    mesh, texture, ctx: c.ctx, cw: c.w, ch: c.h,
    redraw(t) {
      clear(c.ctx, c.w, c.h);
      draw(c.ctx, c.w, c.h, t);
      texture.needsUpdate = true;
    },
  };
}
