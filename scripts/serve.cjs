const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8765);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
// Serve the website's public files, never the whole project or its local state.
const files = {
  '/code-highlight.js': ['code-highlight.js', 'text/javascript'],
  '/favicon.svg': ['favicon.svg', 'image/svg+xml'],
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/docs.html': ['docs.html', 'text/html'],
  '/site.css': ['site.css', 'text/css'],
  '/demo.js': ['demo.js', 'text/javascript'],
  '/guard.js': ['guard.js', 'text/javascript'],
  '/guard.mjs': ['guard.mjs', 'text/javascript'],
  '/README.md': ['README.md', 'text/plain'],
};
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await fs.readFile(path.join(root, file[0]));
    res.writeHead(200, { 'Content-Type': file[1] + '; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('Unable to read website file.'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the other server or set PORT.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Browser Guard: http://127.0.0.1:${port}/`));
