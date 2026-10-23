import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { WIDTH, HEIGHT, norm, smoothstep, SCRIM } from './timeline.js';

// HDR render target with MSAA → subtle bloom (bright highlights only) →
// neutral tone mapping (OutputPass) → final grade: chromatic aberration, vignette, film grain, reveal scrim.

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uT: { value: 0 },
    uScrim: { value: 0 },
    uCA: { value: 0.0016 },
    uVig: { value: 0.32 },
    uGrain: { value: 0.028 },
    uRes: { value: new THREE.Vector2(WIDTH, HEIGHT) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uT, uScrim, uCA, uVig, uGrain;
    uniform vec2 uRes;
    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p.yx + 19.19);
      return fract((p.x + p.y) * p.x);
    }
    void main() {
      vec2 uv = vUv;
      vec2 centered = uv - 0.5;
      float r = length(centered);
      vec2 dir = r > 0.0001 ? centered / r : vec2(0.0);
      float ca = uCA * r * r;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * ca).b;
      // vignette
      col *= 1.0 - uVig * smoothstep(0.32, 0.92, r);
      // film grain (frame-rate based noise, deterministic in t)
      float n = hash(uv * uRes * 0.5 + vec2(uT * 61.7, uT * 47.3)) - 0.5;
      col += n * uGrain;
      // dark scrim for the reveal
      col = mix(col, vec3(0.012, 0.011, 0.02), uScrim);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function buildPost(renderer, scene, camera) {
  const rt = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
    type: THREE.HalfFloatType,
    samples: 4,
    colorSpace: THREE.LinearSRGBColorSpace,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.setSize(WIDTH, HEIGHT);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(WIDTH, HEIGHT), 0.32, 0.55, 1.02);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  grade.renderToScreen = true;
  composer.addPass(grade);

  return {
    composer, bloom, grade,
    update(t) {
      grade.uniforms.uT.value = t;
      grade.uniforms.uScrim.value = 0.5 * smoothstep(norm(t, SCRIM[0], SCRIM[1]));
    },
    // Two-layer render: world (layer 0, with bloom + grade/scrim), then overlay
    // text (layer 1) on top so titles stay bright above the scrim.
    render() {
      camera.layers.set(0);
      composer.render();
      const oldAuto = renderer.autoClear;
      renderer.autoClear = false;
      camera.layers.set(1);
      renderer.render(scene, camera);
      camera.layers.set(0);
      renderer.autoClear = oldAuto;
    },
  };
}
