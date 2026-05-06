const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 4173);
const rootDir = path.resolve(__dirname, '..', '..');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.php': 'text/plain; charset=utf-8'
};

function send(res, statusCode, body, type) {
  res.writeHead(statusCode, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

function resolveRequest(urlPath) {
  const cleanPath = decodeURIComponent((urlPath || '/').split('?')[0]);
  const requested = cleanPath === '/' ? '/dashboard.html' : cleanPath;
  const absolute = path.normalize(path.join(rootDir, requested));
  if (!absolute.startsWith(rootDir)) return null;
  return absolute;
}

const server = http.createServer((req, res) => {
  const absolute = resolveRequest(req.url);
  if (!absolute) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(absolute, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      send(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(absolute).toLowerCase();
    const type = contentTypes[ext] || 'application/octet-stream';
    fs.readFile(absolute, (readErr, data) => {
      if (readErr) {
        send(res, 500, 'Server error');
        return;
      }
      send(res, 200, data, type);
    });
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Live dashboard server running at http://127.0.0.1:${port}/dashboard.html`);
});
