import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { edgeTTSSynthesize, parseTtsPayload } from './edge-tts.mjs';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const www = join(root, 'www');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

async function handleTTS(req, res) {
  const contentType = String(req.headers['content-type'] || '');
  if (contentType && !contentType.includes('application/json')) {
    res.writeHead(415, { 'Content-Type': 'application/json' });
    res.end('{"error":"Content-Type must be application/json"}');
    return;
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 4096) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end('{"error":"Body too large"}');
      req.destroy();
      return;
    }
  }
  let payload;
  try {
    payload = parseTtsPayload(body);
  } catch (err) {
    const status = err.status || 400;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
    return;
  }
  try {
    const audio = await edgeTTSSynthesize(payload.text, payload.voice);
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=3600' });
    res.end(audio);
  } catch (err) {
    console.error('TTS error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/tts' && req.method === 'POST') { handleTTS(req, res); return; }
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const filePath = join(www, urlPath);
  if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Não Encontrado');
  }
});

let port = parseInt(process.env.PORT || '3030', 10);
function start(p) {
  server.listen(p, '127.0.0.1', () => console.log(`\n✨ Leaki Web: http://localhost:${p}\n🔊 Edge TTS ativo em POST /tts\n`));
  server.on('error', (e) => { if (e.code === 'EADDRINUSE') start(p + 1); else console.error(e); });
}
start(port);
