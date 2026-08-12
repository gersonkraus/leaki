import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import WebSocket from 'ws';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0];
const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

function generateSecMsGec() {
  let ticks = Date.now() / 1000 + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= S_TO_NS / 100;
  return createHash('sha256').update(`${Math.floor(ticks)}${TRUSTED_CLIENT_TOKEN}`).digest('hex').toUpperCase();
}

function connectId() { return randomUUID().replace(/-/g, ''); }
function dateFmt() { return new Date().toUTCString().replace(/GMT/, 'GMT+0000 (Coordinated Universal Time)'); }

function buildSSML(text, voice) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escaped}</prosody></voice></speak>`;
}

function edgeTTSSynthesize(text, voice) {
  return new Promise((resolve, reject) => {
    const cid = connectId();
    const secMsGec = generateSecMsGec();
    const muid = randomUUID().replace(/-/g, '').toUpperCase().slice(0, 32);
    const url = `${WSS_URL}&ConnectionId=${cid}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

    const ws = new WebSocket(url, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': `muid=${muid};`
      }
    });

    const audioChunks = [];

    ws.on('open', () => {
      const ts = dateFmt();
      ws.send(`X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-96kbitrate-mono-mp3"}}}}`);
      ws.send(`X-RequestId:${connectId()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${buildSSML(text, voice)}`);
    });

    ws.on('message', (data) => {
      if (Buffer.isBuffer(data) && data.length > 2) {
        const headerLen = data.readUInt16BE(0);
        const header = data.slice(2, 2 + headerLen).toString('utf-8');
        if (header.includes('Path:audio')) {
          audioChunks.push(data.slice(2 + headerLen));
        } else if (header.includes('Path:turn.end')) {
          if (audioChunks.length > 0) { ws.close(); resolve(Buffer.concat(audioChunks)); }
          else { ws.close(); reject(new Error('No audio received')); }
        }
      }
    });

    ws.on('close', () => { if (audioChunks.length > 0) resolve(Buffer.concat(audioChunks)); });
    ws.on('error', (err) => reject(err));
    setTimeout(() => { try { ws.close(); } catch {} reject(new Error('TTS timeout')); }, 15000);
  });
}

const root = join(fileURLToPath(import.meta.url), '..', '..');
const www = join(root, 'www');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

async function handleTTS(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;
  let text, voice;
  try { ({ text, voice } = JSON.parse(body)); }
  catch { res.writeHead(400); res.end('{"error":"Invalid JSON"}'); return; }
  try {
    const audio = await edgeTTSSynthesize(text || 'Olá', voice || 'pt-BR-FranciscaNeural');
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
