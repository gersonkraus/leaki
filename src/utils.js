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

function isValidSpeechResult(fb) {
  return !!(fb && String(fb.spokenText || "").trim());
}

function rateSpeechAndTime(accuracy, frontTimeSec, audioPlaysCount, readingTimeSec) {
  let acc = Number(accuracy);
  if (!Number.isFinite(acc)) acc = 0;
  let timeSec = Math.max(0, Number(frontTimeSec) || 0);
  let plays = Math.max(0, Number(audioPlaysCount) || 0);
  let limit = Number(readingTimeSec);
  if (!Number.isFinite(limit) || limit <= 0) limit = 7;
  let severe = Math.max(limit * 2, limit + 8);
  let roundedTime = Math.round(timeSec);
  if (acc < 50) {
    return { rating: "again", reason: "Voz incorreta (" + Math.round(acc) + "%)", timeSec: roundedTime, audioUsed: plays > 0 };
  }
  if (acc < 80) {
    return { rating: "hard", reason: "Voz: " + Math.round(acc) + "%", timeSec: roundedTime, audioUsed: plays > 0 };
  }
  if (plays >= 2 || timeSec >= severe) {
    return {
      rating: "hard",
      reason: "Leu certo, mas com muita dificuldade (" + roundedTime + "s / limite " + limit + "s" + (plays > 0 ? ", " + plays + "x áudio" : "") + ")",
      timeSec: roundedTime,
      audioUsed: plays > 0
    };
  }
  if (plays >= 1) {
    return { rating: "hard", reason: "Leu certo, mas precisou ouvir o áudio", timeSec: roundedTime, audioUsed: !0 };
  }
  if (timeSec > limit) {
    return { rating: "hard", reason: "Leu certo, mas hesitou (" + roundedTime + "s / limite " + limit + "s)", timeSec: roundedTime, audioUsed: !1 };
  }
  return { rating: "good", reason: "Leitura correta e no tempo", timeSec: roundedTime, audioUsed: !1 };
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

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== !1;
}

let _micExplained = !1;

function wasMicExplained() {
  if (_micExplained) return !0;
  try { return sessionStorage.getItem("leaki-mic-ok") === "1"; } catch (e) { return !1; }
}

function rememberMicExplained() {
  _micExplained = !0;
  try { sessionStorage.setItem("leaki-mic-ok", "1"); } catch (e) {}
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
      if (!isOnline()) throw new Error("offline");
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

async function synthesizeToDataUrl(text) {
  if (!text || !isEdgeTTSVoice(_ttsVoiceName) || !isOnline()) return "";
  try {
    let voiceId = normalizeEdgeVoiceId(_ttsVoiceName);
    let blob = await getCachedTtsBlob(ttsCacheKey(voiceId, text));
    if (!blob) {
      blob = await synthesizeEdgeAudio(text, voiceId);
      rememberTtsBlob(ttsCacheKey(voiceId, text), blob);
    }
    return await new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return "";
  }
}

function feedbackFromAccuracy(acc) {
  return acc >= 80 ? "🌟 Excelente leitura!" : acc >= 50 ? "🟨 Quase lá! Pratique o som." : "❌ Pratique mais uma vez.";
}

function speechQuality(acc) {
  return acc >= 80 ? "excelente" : acc >= 50 ? "quase_la" : "precisa_praticar";
}

async function recognizeSpeechPt() {
  if (isNativeApp()) {
    let plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SpeechRec;
    if (plugin && typeof plugin.listen === "function") {
      try {
        let res = await plugin.listen({ language: "pt-BR" });
        return { transcript: (res && res.transcript) || "", error: null, source: "native" };
      } catch (err) {
        let msg = String(err && (err.message || err) || "error");
        if (msg === "unavailable") {
          /* fall through to web */
        } else {
          return { transcript: "", error: msg, source: "native" };
        }
      }
    }
  }
  return await recognizeSpeechWeb();
}

function recognizeSpeechWeb() {
  return new Promise(resolve => {
    let SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      resolve({ transcript: "", error: "unavailable", source: "web" });
      return;
    }
    try {
      let recognition = new SpeechRec();
      recognition.lang = "pt-BR";
      recognition.interimResults = !1;
      recognition.maxAlternatives = 1;
      let settled = !1;
      let timer = setTimeout(() => {
        try { recognition.stop(); } catch (e) {}
      }, 8000);
      function done(result) {
        if (settled) return;
        settled = !0;
        clearTimeout(timer);
        resolve(result);
      }
      recognition.onresult = event => {
        let transcript = event.results?.[0]?.[0]?.transcript || "";
        done({ transcript, error: transcript.trim() ? null : "no-speech", source: "web" });
      };
      recognition.onerror = event => {
        done({ transcript: "", error: event.error || "error", source: "web" });
      };
      recognition.onend = () => {
        done({ transcript: "", error: "no-speech", source: "web" });
      };
      recognition.start();
    } catch (e) {
      resolve({ transcript: "", error: "error", source: "web" });
    }
  });
}

function speechErrorFeedback(code) {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Permissão do microfone negada. Permita o acesso ao microfone.";
  }
  if (code === "no-speech" || code === "no-match") {
    return "Nenhuma fala detectada. Tente falar mais alto e perto do microfone.";
  }
  if (code === "network") {
    return "Sem rede para reconhecer a voz. Tente de novo ou baixe o pacote de voz do Android.";
  }
  if (code === "unavailable") {
    return "Reconhecimento de voz não disponível neste aparelho.";
  }
  return "Erro no reconhecimento de voz. Tente novamente.";
}

function bufToB64(buf) {
  let bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64) {
  let bin = atob(b64);
  let bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function randomBytes(n) {
  let a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

async function derivePinBits(pin, saltB64) {
  let enc = new TextEncoder();
  let key = await crypto.subtle.importKey("raw", enc.encode(String(pin)), "PBKDF2", !1, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64ToBuf(saltB64), iterations: 1e5, hash: "SHA-256" }, key, 256);
}

async function hashPin(pin, saltB64) {
  return bufToB64(await derivePinBits(pin, saltB64));
}

async function deriveAesKey(pin, saltB64) {
  let enc = new TextEncoder();
  let base = await crypto.subtle.importKey("raw", enc.encode(String(pin)), "PBKDF2", !1, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64ToBuf(saltB64), iterations: 1e5, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, !1, ["encrypt", "decrypt"]);
}

async function encryptSecret(plain, pin, saltB64) {
  if (!plain) return { enc: "", iv: "" };
  let key = await deriveAesKey(pin, saltB64);
  let iv = randomBytes(12);
  let data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return { enc: bufToB64(data), iv: bufToB64(iv.buffer) };
}

async function decryptSecret(enc, iv, pin, saltB64) {
  if (!enc || !iv) return "";
  let key = await deriveAesKey(pin, saltB64);
  let data = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBuf(iv) }, key, b64ToBuf(enc));
  return new TextDecoder().decode(data);
}

let _unlockedPin = "";

function setUnlockedPin(pin) {
  _unlockedPin = pin || "";
}

function getUnlockedPin() {
  return _unlockedPin;
}

function hasParentPin(cfg) {
  return !!(cfg && cfg.pinHash && cfg.pinSalt);
}

function persistableAISettings(cfg) {
  let copy = Object.assign({}, cfg || {});
  if (copy.pinHash && (copy.geminiKeyEnc || copy.geminiKey)) {
    copy.geminiKey = "";
  }
  return copy;
}

async function createParentPin(pin, cfg) {
  let salt = bufToB64(randomBytes(16).buffer);
  let pinHash = await hashPin(pin, salt);
  let next = Object.assign({}, cfg || {}, { pinSalt: salt, pinHash });
  if (cfg && cfg.geminiKey) {
    let sealed = await encryptSecret(cfg.geminiKey, pin, salt);
    next.geminiKeyEnc = sealed.enc;
    next.geminiKeyIv = sealed.iv;
    next.geminiKey = cfg.geminiKey;
  }
  setUnlockedPin(pin);
  return next;
}

async function verifyParentPin(pin, cfg) {
  if (!hasParentPin(cfg)) return !1;
  let hashed = await hashPin(pin, cfg.pinSalt);
  return hashed === cfg.pinHash;
}

async function unlockParentSettings(pin, cfg) {
  if (!(await verifyParentPin(pin, cfg))) return null;
  setUnlockedPin(pin);
  let next = Object.assign({}, cfg);
  if (cfg.geminiKeyEnc && cfg.geminiKeyIv) {
    try {
      next.geminiKey = await decryptSecret(cfg.geminiKeyEnc, cfg.geminiKeyIv, pin, cfg.pinSalt);
    } catch (e) {
      next.geminiKey = "";
    }
  }
  return next;
}

async function sealGeminiKey(cfg, plainKey) {
  let pin = getUnlockedPin();
  let next = Object.assign({}, cfg, { geminiKey: plainKey || "" });
  if (pin && cfg && cfg.pinSalt) {
    let sealed = await encryptSecret(plainKey || "", pin, cfg.pinSalt);
    next.geminiKeyEnc = sealed.enc;
    next.geminiKeyIv = sealed.iv;
  }
  return next;
}

function resetParentPin(cfg) {
  setUnlockedPin("");
  let next = Object.assign({}, cfg || {});
  delete next.pinHash;
  delete next.pinSalt;
  delete next.geminiKeyEnc;
  delete next.geminiKeyIv;
  next.geminiKey = "";
  return next;
}

function buildParentDigest(history, cards, nowMs) {
  let now = Number.isFinite(nowMs) ? nowMs : Date.now();
  let weekAgo = now - 7 * 864e5;
  let recent = (history || []).filter(h => {
    let t = new Date(h.date).getTime();
    return Number.isFinite(t) && t >= weekAgo;
  });
  let voice = [];
  let struggled = [];
  recent.forEach(h => {
    (h.voiceAttempts || []).forEach(va => voice.push(va));
    (h.struggledCards || []).forEach(sc => struggled.push(sc));
  });
  let wordMap = new Map();
  struggled.forEach(sc => {
    let key = String(sc.word || "").trim();
    if (!key) return;
    let cur = wordMap.get(key) || { word: key, count: 0, lastReason: "" };
    cur.count += 1;
    cur.lastReason = sc.reason || cur.lastReason;
    wordMap.set(key, cur);
  });
  let hardWords = Array.from(wordMap.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  let voiceAvg = voice.length ? Math.round(voice.reduce((s, v) => s + (Number(v.accuracy) || 0), 0) / voice.length) : null;
  let sessions = recent.length;
  let minutes = Math.round(recent.reduce((s, h) => s + (h.durationSeconds || 0), 0) / 60);
  let tomorrow = [];
  (cards || []).forEach(card => {
    if (!card || !card.front) return;
    if (!card.due || new Date(card.due).getTime() <= now + 864e5) tomorrow.push(card.front);
  });
  tomorrow = [...new Set(tomorrow)].slice(0, 8);
  return { sessions, minutes, voiceAvg, voiceCount: voice.length, hardWords, tomorrow };
}

function backupFilename() {
  return "leaki-" + new Date().toISOString().slice(0, 10) + ".leaki";
}

async function shareBackupFile(jsonText, filename) {
  let name = filename || backupFilename();
  let plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LeakiShare;
  if (plugin && typeof plugin.shareTextFile === "function") {
    await plugin.shareTextFile({ filename: name, content: jsonText });
    return "shared";
  }
  let blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  let file = new File([blob], name, { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], title: "Backup Leaki" });
    return "shared";
  }
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
  return "downloaded";
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

