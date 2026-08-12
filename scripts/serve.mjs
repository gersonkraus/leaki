import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const www = join(root, 'www');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  const filePath = join(www, urlPath);

  if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Não Encontrado');
  }
});

let defaultPort = parseInt(process.env.PORT || '3030', 10);

function startServer(portToTry) {
  server.listen(portToTry, '127.0.0.1', () => {
    console.log(`\n✨ Leaki Web rodando em: http://localhost:${portToTry}`);
    console.log(`💡 Pressione Ctrl+C para encerrar.\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Porta ${portToTry} ocupada, tentando porta ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error(err);
    }
  });
}

startServer(defaultPort);
