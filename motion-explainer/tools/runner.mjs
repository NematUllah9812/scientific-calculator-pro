// Shared Playwright launch + seek/screenshot plumbing for check & render tools.
import { chromium } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';

const { inflate } = sparticuz;

const ROOT = normalizeRoot();
function normalizeRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

export async function ensureBrowserAssets() {
  sparticuz.setGraphicsMode = true;
  process.env.LD_LIBRARY_PATH = '/tmp/al2023/lib:/tmp';
  if (!existsSync('/tmp/al2023/lib/libnspr4.so')) {
    const bin = join(ROOT, 'node_modules/@sparticuz/chromium/bin');
    await inflate(join(bin, 'al2023.tar.br'));
  }
  return sparticuz.executablePath();
}

export async function launchBrowser() {
  const exePath = await ensureBrowserAssets();
  return chromium.launch({
    executablePath: exePath,
    args: [...sparticuz.args, '--no-sandbox'],
    headless: true,
  });
}

export async function openExplainer(browser, port) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?freeze=1&t=0`);
  await page.waitForFunction(() => window.__explainer?.ready === true, null, { timeout: 120000 });
  return page;
}

export async function captureFrame(page, t, outPath, retries = 3) {
  await page.evaluate((tt) => window.__explainer.seek(tt), t);
  for (let i = 0; i < retries; i++) {
    try {
      await page.screenshot({ path: outPath, type: 'png', timeout: 90000, animations: 'disabled' });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`  screenshot retry ${i + 1} for t=${t.toFixed(2)}`);
    }
  }
}

export function makeOutDir(...parts) {
  const p = join(ROOT, 'out', ...parts);
  mkdirSync(p, { recursive: true });
  return p;
}

export function projectRoot() {
  return ROOT;
}
