function normalizeStr(e) {
  return (e || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function levenshtein(e, t) {
  let n = e ? e.length : 0,
    r = t ? t.length : 0;
  if (0 === n) return r;
  if (0 === r) return n;
  let a = Array.from({ length: r + 1 }, (e, t) => [t]);
  for (let t = 0; t <= n; t++) a[0][t] = t;
  for (let l = 1; l <= r; l++)
    for (let i = 1; i <= n; i++)
      t.charAt(l - 1) === e.charAt(i - 1)
        ? (a[l][i] = a[l - 1][i - 1])
        : (a[l][i] = Math.min(a[l - 1][i - 1] + 1, a[l][i - 1] + 1, a[l - 1][i] + 1));
  return a[r][n];
}

function calculateSpeechAccuracy(e, t) {
  let n = normalizeStr(e),
    r = normalizeStr(t);
  if (!n) return 0;
  if (n === r) return 100;
  let a = n.split(/\s+/).filter(Boolean),
    l = r.split(/\s+/).filter(Boolean);
  if (l.length > 1) {
    let e = 0;
    for (let t of l) {
      let n = 0;
      for (let r of a) {
        let a = levenshtein(r, t),
          l = Math.max(r.length, t.length),
          i = Math.max(0, Math.round((1 - a / l) * 100));
        i > n && (n = i);
      }
      e += n;
    }
    return Math.round(e / l.length);
  }
  let i = levenshtein(n, r),
    o = Math.max(n.length, r.length);
  return Math.max(0, Math.round((1 - i / o) * 100));
}

const EDGE_TTS_VOICES = [
  { id: "pt-BR-FranciscaNeural", label: "Francisca (Neural)", gender: "feminina" },
  { id: "pt-BR-AntonioNeural", label: "Antonio (Neural)", gender: "masculina" },
  { id: "pt-BR-ThalitaMultilingualNeural", label: "Thalita (Neural multilíngue)", gender: "feminina" }
];

const EDGE_VOICE_ALIASES = {
  "pt-BR-ThalitaNeural": "pt-BR-ThalitaMultilingualNeural",
  "pt-BR-ValerioNeural": "pt-BR-AntonioNeural",
  "pt-BR-ManuelaNeural": "pt-BR-FranciscaNeural",
  "pt-BR-NicolauNeural": "pt-BR-AntonioNeural"
};

const TTS_CACHE_MAX = 80;
const TTS_FETCH_TIMEOUT_MS = 10000;

let _ttsVoiceName = "";
let _ttsMemCache = new Map();
let _ttsAudio = null;
let _ttsObjectUrl = "";
let _ttsSpeakGen = 0;

function getEdgeTTSVoices() {
  return EDGE_TTS_VOICES.slice();
}

function normalizeEdgeVoiceId(voice) {
  let id = String(voice || "").replace(/^edge:/, "").trim();
  if (!id) return "pt-BR-FranciscaNeural";
  return EDGE_VOICE_ALIASES[id] || id;
}

function isEdgeTTSVoice(name) {
  return String(name || "").startsWith("edge:");
}

function ttsCacheKey(voiceId, text) {
  return voiceId + "\0" + String(text || "").trim().toLowerCase();
}

function isNativeApp() {
  try {
    return !!(window.Capacitor && (window.Capacitor.isNativePlatform ? window.Capacitor.isNativePlatform() : window.Capacitor.isNative));
  } catch (e) {
    return false;
  }
}

function getBrazilianVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices().filter(v =>
    v.lang === "pt-BR" || v.lang === "pt_BR" || v.lang === "pt"
  );
}

function pickBestVoice() {
  let voices = getBrazilianVoices();
  if (!voices.length) return null;
  if (_ttsVoiceName && !isEdgeTTSVoice(_ttsVoiceName)) {
    let chosen = voices.find(v => v.name === _ttsVoiceName);
    if (chosen) return chosen;
  }
  let natural = voices.find(v => /natural|neural|enhanced|premium/i.test(v.name));
  if (natural) return natural;
  let google = voices.find(v => /google/i.test(v.name));
  if (google) return google;
  let female = voices.find(v => /female|feminina|maria|ana|lucia|helena|lorena|julia/i.test(v.name));
  if (female) return female;
  return voices[0];
}

function setTTSVoice(name) {
  if (isEdgeTTSVoice(name)) {
    _ttsVoiceName = "edge:" + normalizeEdgeVoiceId(name);
  } else {
    _ttsVoiceName = name || "";
  }
}

function getTTSVoiceName() {
  return _ttsVoiceName;
}

function stopTTSPlayback() {
  if (_ttsAudio) {
    try {
      _ttsAudio.pause();
      _ttsAudio.removeAttribute("src");
      _ttsAudio.load();
    } catch (e) {}
    _ttsAudio = null;
  }
  if (_ttsObjectUrl) {
    try { URL.revokeObjectURL(_ttsObjectUrl); } catch (e) {}
    _ttsObjectUrl = "";
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function speakLocalTTS(text) {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  let utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  utter.rate = 0.88;
  let voice = pickBestVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}

function rememberTtsBlob(key, blob) {
  if (!blob || !blob.size) return;
  if (_ttsMemCache.has(key)) _ttsMemCache.delete(key);
  _ttsMemCache.set(key, blob);
  while (_ttsMemCache.size > TTS_CACHE_MAX) {
    _ttsMemCache.delete(_ttsMemCache.keys().next().value);
  }
  persistTtsBlob(key, blob).catch(() => {});
}

function openTtsCacheDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("no idb"));
      return;
    }
    let req = window.indexedDB.open("leaki-tts-cache", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("audio")) req.result.createObjectStore("audio");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function persistTtsBlob(key, blob) {
  let db = await openTtsCacheDb();
  await new Promise((resolve, reject) => {
    let tx = db.transaction("audio", "readwrite");
    tx.objectStore("audio").put({ blob, at: Date.now() }, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readPersistedTtsBlob(key) {
  let db = await openTtsCacheDb();
  return await new Promise((resolve, reject) => {
    let req = db.transaction("audio", "readonly").objectStore("audio").get(key);
    req.onsuccess = () => resolve(req.result && req.result.blob ? req.result.blob : null);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedTtsBlob(key) {
  if (_ttsMemCache.has(key)) return _ttsMemCache.get(key);
  try {
    let blob = await readPersistedTtsBlob(key);
    if (blob) {
      _ttsMemCache.set(key, blob);
      return blob;
    }
  } catch (e) {}
  return null;
}

function blobFromBase64(b64, mime) {
  let bin = atob(b64);
  let bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || "audio/mpeg" });
}

async function synthesizeViaNativePlugin(text, voiceId) {
  let plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.EdgeTts;
  if (!plugin || typeof plugin.speak !== "function") return null;
  let res = await plugin.speak({ text, voice: voiceId });
  if (!res || !res.audioBase64) return null;
  return blobFromBase64(res.audioBase64, "audio/mpeg");
}

async function synthesizeViaLocalServer(text, voiceId) {
  let ctrl = new AbortController();
  let timer = setTimeout(() => ctrl.abort(), TTS_FETCH_TIMEOUT_MS);
  try {
    let resp = await fetch("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voiceId }),
      signal: ctrl.signal
    });
    if (!resp.ok) throw new Error("TTS failed");
    return await resp.blob();
  } finally {
    clearTimeout(timer);
  }
}

async function synthesizeEdgeAudio(text, voiceId) {
  if (isNativeApp()) {
    let nativeBlob = await synthesizeViaNativePlugin(text, voiceId);
    if (nativeBlob && nativeBlob.size) return nativeBlob;
    throw new Error("Edge TTS nativo indisponível");
  }
  return await synthesizeViaLocalServer(text, voiceId);
}

function releaseTtsUrl(url) {
  if (_ttsObjectUrl !== url) return;
  try { URL.revokeObjectURL(url); } catch (e) {}
  _ttsObjectUrl = "";
  if (_ttsAudio) _ttsAudio = null;
}

function playTtsBlob(blob) {
  stopTTSPlayback();
  let url = URL.createObjectURL(blob);
  _ttsObjectUrl = url;
  let audio = new Audio(url);
  _ttsAudio = audio;
  audio.onended = () => releaseTtsUrl(url);
  audio.onerror = () => releaseTtsUrl(url);
  return audio.play().catch(err => {
    releaseTtsUrl(url);
    throw err;
  });
}

async function speakWordTTS(text) {
  if (!text) return;
  let gen = ++_ttsSpeakGen;
  stopTTSPlayback();
  let wantsEdge = isEdgeTTSVoice(_ttsVoiceName);
  if (!wantsEdge) {
    speakLocalTTS(text);
    return;
  }
  let voiceId = normalizeEdgeVoiceId(_ttsVoiceName);
  let key = ttsCacheKey(voiceId, text);
  try {
    let blob = await getCachedTtsBlob(key);
    if (gen !== _ttsSpeakGen) return;
    if (!blob) {
      blob = await synthesizeEdgeAudio(text, voiceId);
      if (gen !== _ttsSpeakGen) return;
      rememberTtsBlob(key, blob);
    }
    await playTtsBlob(blob);
  } catch (e) {
    console.error("TTS error:", e);
    if (gen === _ttsSpeakGen) speakLocalTTS(text);
  }
}

async function analyzeWithGemini(audioDataUrl, mimeType, expectedText, apiKey, modelName) {
  let model = (modelName || "gemini-2.0-flash").trim();
  let cleanBase64 = audioDataUrl.includes(",") ? audioDataUrl.split(",")[1] : audioDataUrl;
  let prompt = 'Você é um avaliador pedagógico de leitura infantil em português. A palavra ou frase esperada escrita na tela é: "' + expectedText + '". Analise o áudio da criança e responda APENAS um JSON no formato: {"spokenText": "texto falado", "accuracyScore": número de 0 a 100, "feedback": "comentário pedagógico curto e amigável", "quality": "excelente" ou "quase_la" ou "precisa_praticar"}';
  
  let response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType || "audio/webm", data: cleanBase64 } },
          { text: prompt }
        ]
      }]
    })
  });
  
  if (!response.ok) {
    let errText = await response.text().catch(() => "");
    throw new Error("Erro na API Gemini (" + response.status + "): " + errText);
  }
  
  let data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  let cleanJson = text.replaceAll("```json", "").replaceAll("```", "").trim();
  let parsed = JSON.parse(cleanJson);
  return {
    spokenText: parsed.spokenText || "",
    accuracy: Number(parsed.accuracyScore) || 0,
    feedback: parsed.feedback || "",
    quality: parsed.quality || (parsed.accuracyScore >= 80 ? "excelente" : parsed.accuracyScore >= 50 ? "quase_la" : "precisa_praticar"),
    isAI: !0
  };
}

