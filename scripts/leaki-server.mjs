import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { edgeTTSSynthesize, parseTtsPayload } from "./edge-tts.mjs";
import { createSyncStore, isValidPairKey, normalizePairKey, MAX_SYNC_BYTES } from "./sync-store.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const CORS_ORIGINS = new Set([
  "https://leaki.gerson.com",
  "http://leaki.gerson.com",
  "https://localhost",
  "http://localhost",
  "http://127.0.0.1",
  "https://127.0.0.1",
  "capacitor://localhost"
]);

function allowOrigin(origin) {
  if (!origin) return "";
  if (CORS_ORIGINS.has(origin)) return origin;
  try {
    let u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "leaki.gerson.com") {
      return origin;
    }
  } catch (e) {}
  return "";
}

function setCors(req, res) {
  let origin = allowOrigin(String(req.headers.origin || ""));
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, If-Match");
  res.setHeader("Access-Control-Max-Age", "600");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

const hits = new Map();
function rateLimited(ip) {
  let now = Date.now();
  let row = hits.get(ip) || [];
  row = row.filter((t) => now - t < 60_000);
  if (row.length >= 60) {
    hits.set(ip, row);
    return true;
  }
  row.push(now);
  hits.set(ip, row);
  return false;
}

async function readBody(req, limit) {
  let chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      let err = new Error("too-large");
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function handleTTS(req, res) {
  const contentType = String(req.headers["content-type"] || "");
  if (contentType && !contentType.includes("application/json")) {
    sendJson(res, 415, { error: "Content-Type must be application/json" });
    return;
  }
  let body;
  try {
    body = await readBody(req, 4096);
  } catch (err) {
    sendJson(res, err.status || 400, { error: err.message });
    return;
  }
  let payload;
  try {
    payload = parseTtsPayload(body);
  } catch (err) {
    sendJson(res, err.status || 400, { error: err.message });
    return;
  }
  try {
    let audio = await edgeTTSSynthesize(payload.text, payload.voice);
    res.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" });
    res.end(audio);
  } catch (err) {
    console.error("TTS error:", err.message);
    sendJson(res, 500, { error: err.message });
  }
}

async function handleSync(req, res, store, keyRaw) {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  let ip = String(req.socket.remoteAddress || "unknown");
  if (rateLimited(ip)) {
    sendJson(res, 429, { error: "too-many-requests" });
    return;
  }
  let key = normalizePairKey(decodeURIComponent(keyRaw || ""));
  if (!isValidPairKey(key)) {
    sendJson(res, 400, { error: "invalid-key" });
    return;
  }
  if (req.method === "GET") {
    let doc = store.read(key);
    if (!doc) {
      sendJson(res, 404, { error: "empty" });
      return;
    }
    sendJson(res, 200, doc);
    return;
  }
  if (req.method === "PUT") {
    let raw;
    try {
      raw = await readBody(req, MAX_SYNC_BYTES);
    } catch (err) {
      sendJson(res, err.status || 400, { error: err.message === "too-large" ? "body-too-large" : err.message });
      return;
    }
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      sendJson(res, 400, { error: "invalid-json" });
      return;
    }
    let match = req.headers["if-match"];
    let incomingRev = payload && payload.rev != null ? payload.rev : match;
    let result = store.put(key, incomingRev, payload && payload.snapshot);
    if (result.conflict) {
      sendJson(res, 409, result.doc);
      return;
    }
    sendJson(res, 200, result.doc);
    return;
  }
  sendJson(res, 405, { error: "method-not-allowed" });
}

export function createLeakiServer({ www, dataDir }) {
  const store = createSyncStore(join(dataDir, "sync"));
  return createServer((req, res) => {
    let urlPath = (req.url || "/").split("?")[0];
    try {
      urlPath = decodeURIComponent(urlPath);
    } catch (e) {}
    if (urlPath === "/health") {
      sendJson(res, 200, { ok: true, host: "leaki.gerson.com" });
      return;
    }
    if (urlPath === "/tts" && req.method === "POST") {
      handleTTS(req, res);
      return;
    }
    if (urlPath.startsWith("/sync/")) {
      handleSync(req, res, store, urlPath.slice("/sync/".length));
      return;
    }
    if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
    const filePath = join(www, urlPath);
    if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
      res.writeHead(200, { "Content-Type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream" });
      res.end(readFileSync(filePath));
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Não Encontrado");
  });
}

export function startLeakiServer({ www, dataDir, port, host }) {
  const server = createLeakiServer({ www, dataDir });
  function listen(p) {
    server.listen(p, host, () => {
      console.log(`\nLeaki web:  http://${host}:${p}`);
      console.log(`Sync API:   PUT/GET http://${host}:${p}/sync/<chave>`);
      console.log(`Público:    https://leaki.gerson.com  (túnel Cloudflare)`);
      console.log(`TTS:        POST /tts\n`);
    });
    server.on("error", (e) => {
      if (e.code === "EADDRINUSE") listen(p + 1);
      else console.error(e);
    });
  }
  listen(port);
  return server;
}
