import { createHash, randomUUID } from "node:crypto";
import WebSocket from "ws";

export const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
export const CHROMIUM_FULL_VERSION = "143.0.3650.75";
export const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

export const EDGE_TTS_VOICES = [
  { id: "pt-BR-FranciscaNeural", label: "Francisca (Neural)", gender: "feminina" },
  { id: "pt-BR-AntonioNeural", label: "Antonio (Neural)", gender: "masculina" },
  { id: "pt-BR-ThalitaMultilingualNeural", label: "Thalita (Neural multilíngue)", gender: "feminina" },
];

const EDGE_VOICE_ALIASES = {
  "pt-BR-ThalitaNeural": "pt-BR-ThalitaMultilingualNeural",
  "pt-BR-ValerioNeural": "pt-BR-AntonioNeural",
  "pt-BR-ManuelaNeural": "pt-BR-FranciscaNeural",
  "pt-BR-NicolauNeural": "pt-BR-AntonioNeural",
};

const ALLOWED_VOICE_IDS = new Set(EDGE_TTS_VOICES.map((v) => v.id));
const DEFAULT_EDGE_VOICE = "pt-BR-FranciscaNeural";
const TTS_MAX_BODY_BYTES = 4096;
const TTS_MAX_TEXT_CHARS = 500;

export function resolveEdgeVoice(voice) {
  const id = String(typeof voice === "string" ? voice : "").replace(/^edge:/, "").trim();
  if (!id) return DEFAULT_EDGE_VOICE;
  const mapped = EDGE_VOICE_ALIASES[id] || id;
  return ALLOWED_VOICE_IDS.has(mapped) ? mapped : DEFAULT_EDGE_VOICE;
}

export function parseTtsPayload(raw, { maxBytes = TTS_MAX_BODY_BYTES } = {}) {
  if (typeof raw !== "string") {
    const err = new Error("Invalid body");
    err.status = 400;
    throw err;
  }
  if (raw.length > maxBytes) {
    const err = new Error("Body too large");
    err.status = 413;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = new Error("Invalid JSON");
    err.status = 400;
    throw err;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const err = new Error("Invalid JSON");
    err.status = 400;
    throw err;
  }
  if (typeof parsed.text !== "string" || (parsed.voice != null && typeof parsed.voice !== "string")) {
    const err = new Error("text and voice must be strings");
    err.status = 400;
    throw err;
  }
  const text = parsed.text.trim();
  if (!text || text.length > TTS_MAX_TEXT_CHARS) {
    const err = new Error("text must be a non-empty string up to 500 chars");
    err.status = 400;
    throw err;
  }
  return { text, voice: resolveEdgeVoice(parsed.voice || DEFAULT_EDGE_VOICE) };
}

export function generateSecMsGec(nowMs = Date.now()) {
  let ticks = nowMs / 1000 + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= S_TO_NS / 100;
  return createHash("sha256")
    .update(`${Math.floor(ticks)}${TRUSTED_CLIENT_TOKEN}`)
    .digest("hex")
    .toUpperCase();
}

function connectId() {
  return randomUUID().replace(/-/g, "");
}

function dateFmt() {
  return new Date().toUTCString().replace(/GMT/, "GMT+0000 (Coordinated Universal Time)");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSSML(text, voice) {
  const safeVoice = resolveEdgeVoice(voice);
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><voice name='${escapeXml(safeVoice)}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`;
}

export function edgeTTSSynthesize(text, voice, { timeoutMs = 15000 } = {}) {
  const resolvedVoice = resolveEdgeVoice(voice);
  return new Promise((resolve, reject) => {
    const cid = connectId();
    const secMsGec = generateSecMsGec();
    const muid = randomUUID().replace(/-/g, "").toUpperCase().slice(0, 32);
    const url = `${WSS_URL}&ConnectionId=${cid}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

    const ws = new WebSocket(url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        Cookie: `muid=${muid};`,
      },
    });

    const audioChunks = [];
    let settled = false;
    let completedTurn = false;

    function finish(err, audio) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        if (err) ws.terminate();
        else ws.close();
      } catch {}
      if (err) reject(err);
      else resolve(audio);
    }

    function finishTurn() {
      completedTurn = true;
      if (audioChunks.length > 0) finish(null, Buffer.concat(audioChunks));
      else finish(new Error("No audio received"));
    }

    const timer = setTimeout(() => finish(new Error("TTS timeout")), timeoutMs);

    ws.on("open", () => {
      const ts = dateFmt();
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-96kbitrate-mono-mp3"}}}}`,
      );
      ws.send(
        `X-RequestId:${connectId()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${buildSSML(text, resolvedVoice)}`,
      );
    });

    ws.on("message", (data) => {
      const asString = Buffer.isBuffer(data) ? null : String(data);
      if (asString && asString.includes("Path:turn.end")) {
        finishTurn();
        return;
      }
      if (Buffer.isBuffer(data) && data.length > 2) {
        const headerLen = data.readUInt16BE(0);
        const header = data.slice(2, 2 + headerLen).toString("utf-8");
        if (header.includes("Path:audio.metadata")) return;
        if (header.includes("Path:audio")) {
          const payload = data.slice(2 + headerLen);
          if (payload.length) audioChunks.push(payload);
        } else if (header.includes("Path:turn.end")) {
          finishTurn();
        }
      }
    });

    ws.on("close", () => {
      if (!completedTurn) finish(new Error("Connection closed without complete turn"));
    });

    ws.on("error", (err) => finish(err));
  });
}
