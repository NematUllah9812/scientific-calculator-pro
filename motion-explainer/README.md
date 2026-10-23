# From idea to app with Claude Code — motion explainer

A 15-second, 1920×1080, 60fps motion-graphics explainer built with **Three.js**
(glassmorphism style), rendered **frame by frame** to MP4 with **Playwright + ffmpeg**.
Every animation is a pure function of a time value `t`, so output is fully deterministic.

## The story

| Time | Scene | What happens |
|------|-------|--------------|
| 0–3s | **STEP 01 / DESCRIBE** | Glass chat bar types "Build me a habit tracker with streaks." with a blinking caret, send button lights up, reply bubble shows typing dots then "On it. Here's the plan." |
| 3–6s | **STEP 02 / PLAN** | Five glass task cards slide in over a stack in depth, then tick off one by one with animated checkmarks and strikethroughs. |
| 6–9.5s | **STEP 03 / BUILD** | Dark glass code editor (window dots + tabs) types a React component with syntax colours; six glass file-name tiles orbit it in 3D; ends with a green "✓ 12 tests passed" badge. |
| 10–12.5s | **STEP 04 / SHIP** | Glass phone swings in with the habit app: streak counts up to 12, habits check off, a bar chart grows, instanced confetti bursts under gravity. |
| 12.5–15s | **Reveal** | Camera pulls back to a wide shot of every scene; a dark scrim fades in; "ONE CONVERSATION / Idea → App" and a glass pill "Built with Claude Code" animate in, fixed to the camera. |

Throughout: a glowing tube along a `CatmullRomCurve3` connects all scenes and draws on
with a bright head; clear glass spheres, rings and icosahedrons (with `dispersion`) plus
glowing orbs are scattered for parallax — kept off the camera path via seeded rejection
sampling. World: dark space with a big gradient dome (violet / orange / blue / pink blobs),
frosted-glass panels (`MeshPhysicalMaterial` transmission ≈ 0.92, roughness ≈ 0.4,
rounded extruded slabs) with canvas textures redrawn every frame for the UI
(white border + white text, accent `#ff8a4c`).

Finish: HDR render target (HalfFloat) with 4× MSAA, subtle bloom on bright highlights
only, neutral tone mapping (`NeutralToneMapping`), then a final grade pass with slight
chromatic aberration, vignette, film grain and the reveal scrim. Reveal titles render in
a second layer above the scrim so they stay crisp.

## Rendering pipeline

- `src/` — scene modules. `window.__explainer.seek(t)` updates every animation from `t`
  and renders exactly one frame (no clocks, no accumulated state).
- `tools/check-frames.mjs` — renders key stills from every scene for review.
- `tools/render.mjs` — renders 900 frames (`t = i / 60`) in parallel headless pages,
  then encodes `out/from-idea-to-app.mp4` with ffmpeg (libx264, yuv420p).
- Determinism: all randomness comes from seeded `mulberry32` PRNGs; confetti uses
  closed-form ballistics in `t`; rotations/drift are absolute functions of `t`
  (safe under arbitrary seeks and parallel rendering).

Because this sandbox has no system Chromium/ffmpeg, the tools use self-contained npm
binaries: `@sparticuz/chromium` (headless Chromium + SwiftShader WebGL2) driven by
`playwright-core`, and `@ffmpeg-installer/ffmpeg`. On first setup run:

```bash
npm install
npm run extract-libs   # unpacks bundled shared libs for the Chromium binary
```

## Commands

```bash
npm run check    # stills from every scene → out/checks/
npm run render   # full 900-frame render → out/from-idea-to-app.mp4
npm run serve    # interactive preview (add ?freeze=1&t=2.5 to scrub a still)
```

Interactive preview: `index.html` loops the animation in real time; `?t=<seconds>`
starts at a given time, `?freeze=1` holds a single deterministic frame.

## Layout

```
index.html            canvas + import map
src/
  timeline.js         windows, easing, master timing
  rand.js             seeded PRNG
  ui.js               canvas-2D UI kit (text, borders, checkmarks, flame, …)
  panels.js           rounded extruded glass slabs + canvas face textures
  world.js            gradient dome, env map, lights, scattered glass/orbs
  tube.js             CatmullRom glowing tube with draw-on head
  camera.js           scene stages, drift + expo-ease whips, pullback arc
  postfx.js           MSAA HDR target, bloom, tone map, CA/vignette/grain/scrim
  scenes/             describe, plan, build, ship, overlay (camera-fixed titles)
tools/
  runner.mjs          shared headless-browser launch + screenshot plumbing
  serve.mjs           static server
  check-frames.mjs    scene stills
  render.mjs          full frame render + ffmpeg encode
  extract-libs.mjs    unpack Chromium shared libs
out/                  render output (gitignored)
```
