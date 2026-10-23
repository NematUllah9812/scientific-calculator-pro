// Minimal static file server for the explainer (also used by render/check tools).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

export function rootDir() {
  return normalize(new URL('..', import.meta.url).pathname);
}

export async function startServer(root = rootDir()) {
  const server = http.createServer(async (req, res) => {
    try {
      const p = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
      if (!p.startsWith(root)) throw new Error('forbidden');
      const data = await readFile(p);
      res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '0.0.0.0', r));
  return { server, port: server.address().port };
}

// CLI: npm run serve → serves on port 8123
if (import.meta.url === `file://${process.argv[1]}`) {
  const { server, port } = await startServer();
  server.listen; // no-op
  console.log(`serving on http://127.0.0.1:${port}/index.html (proxied preview uses its own port)`);
}
