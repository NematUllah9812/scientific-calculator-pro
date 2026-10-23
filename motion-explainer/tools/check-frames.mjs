// Renders key stills from every scene for visual review before the full render.
// Usage: npm run check
import { join } from 'node:path';
import { startServer } from './serve.mjs';
import { launchBrowser, openExplainer, captureFrame, makeOutDir } from './runner.mjs';

const CHECK_TIMES = [
  0.6, 1.5, 2.2, 2.85,      // describe
  3.4, 4.2, 5.0, 5.85,      // plan
  6.5, 7.4, 8.3, 9.25,      // build
  10.15, 10.8, 11.6, 12.35, // ship
  12.9, 13.55, 14.4, 14.95, // reveal
];

const { server, port } = await startServer();
const outDir = makeOutDir('checks');
const browser = await launchBrowser();
const page = await openExplainer(browser, port);

for (const t of CHECK_TIMES) {
  const name = `t${t.toFixed(2).padStart(5, '0')}.png`;
  await captureFrame(page, t, join(outDir, name));
  console.log('wrote', name);
}

await browser.close();
server.close();
console.log('checks done →', outDir);
