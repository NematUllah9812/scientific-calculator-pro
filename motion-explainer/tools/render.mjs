// Full deterministic render: 900 frames @ 60fps → MP4 via ffmpeg.
// Usage: npm run render        (or: node tools/render.mjs --workers 3)
import { join } from 'node:path';
import { mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { startServer } from './serve.mjs';
import { launchBrowser, openExplainer, captureFrame, projectRoot } from './runner.mjs';

const execFileAsync = promisify(execFile);
const FPS = 60;
const FRAMES = 900;
const OUT_NAME = 'from-idea-to-app.mp4';

const args = process.argv.slice(2);
const workerArg = args.indexOf('--workers');
const WORKERS = workerArg >= 0 ? parseInt(args[workerArg + 1], 10) : 3;

const ROOT = projectRoot();
const framesDir = join(ROOT, 'out', 'frames');
const resume = !args.includes('--fresh');
if (!resume) rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

const missing = [];
for (let f = 0; f < FRAMES; f++) {
  const name = `f${String(f).padStart(4, '0')}.png`;
  if (!resume || !existsSync(join(framesDir, name))) missing.push(f);
}

const { server, port } = await startServer();
console.log(`server on :${port}, ${WORKERS} workers, ${missing.length}/${FRAMES} frames to render (resume=${resume})`);
const browser = await launchBrowser();
const pages = [];
for (let i = 0; i < WORKERS; i++) pages.push(await openExplainer(browser, port));

const t0 = Date.now();
let done = 0;
const chunk = Math.ceil(missing.length / WORKERS);

await Promise.all(pages.map(async (page, w) => {
  const start = w * chunk;
  const end = Math.min(missing.length, start + chunk);
  for (let idx = start; idx < end; idx++) {
    const f = missing[idx];
    const name = `f${String(f).padStart(4, '0')}.png`;
    await captureFrame(page, f / FPS, join(framesDir, name));
    done++;
    if (done % 25 === 0 || done === missing.length) {
      const elapsed = (Date.now() - t0) / 1000;
      const rate = done / elapsed;
      console.log(`${done}/${missing.length} frames — ${Math.round((missing.length - done) / rate)}s left`);
    }
  }
}));

await browser.close();
server.close();

const files = readdirSync(framesDir).filter((f) => f.endsWith('.png'));
if (files.length !== FRAMES) {
  console.error(`expected ${FRAMES} frames, found ${files.length}`);
  process.exit(1);
}

const outPath = join(ROOT, 'out', OUT_NAME);
const ff = ffmpegInstaller.path;
await execFileAsync(ff, [
  '-y',
  '-framerate', String(FPS),
  '-i', join(framesDir, 'f%04d.png'),
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-crf', '16',
  '-preset', 'medium',
  '-movflags', '+faststart',
  outPath,
], { maxBuffer: 1 << 26 });

console.log('encoded →', outPath);
