// Serves the static export in out/ the way a static host would (npm start):
// clean URLs, the exported 404 page, gzip for text, and long-lived caching for
// hashed build assets, so local performance checks resemble production.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve('out');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const compressible = new Set(['.html', '.js', '.css', '.json', '.txt', '.xml', '.svg']);
const gzipped = new Map();

const isFile = async path => { try { return (await stat(path)).isFile(); } catch { return false; } };

// /timeline is out/timeline.html. Check it before out/timeline/: Next.js also
// writes a directory of that name for the page's RSC payloads.
async function locate(pathname) {
  const file = resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + sep)) return null;
  const candidates = extname(file) ? [file] : [file + '.html', resolve(file, 'index.html')];
  for (const c of candidates) if (await isFile(c)) return c;
  return null;
}

async function send(req, res, file, status) {
  const ext = extname(file);
  const headers = { 'Content-Type': types[ext] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
  headers['Cache-Control'] = file.includes(`${sep}_next${sep}static${sep}`) ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate';
  let body = await readFile(file);
  if (compressible.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    // Keyed by modification time too, so a rebuild is never served stale.
    const { mtimeMs } = await stat(file);
    const key = `${file}:${mtimeMs}`;
    if (!gzipped.has(key)) gzipped.set(key, gzipSync(body));
    body = gzipped.get(key);
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const file = await locate(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (file) return await send(req, res, file, 200);
    const notFound = resolve(root, '404.html');
    if (await isFile(notFound)) return await send(req, res, notFound, 404);
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found');
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('Server error');
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => console.log(`AGI Museum: http://localhost:${port}`));
