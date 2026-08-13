import assert from "node:assert/strict";
import {
  EDGE_TTS_VOICES,
  resolveEdgeVoice,
  generateSecMsGec,
  edgeTTSSynthesize,
  parseTtsPayload,
} from "./edge-tts.mjs";

assert.equal(resolveEdgeVoice("edge:pt-BR-ValerioNeural"), "pt-BR-AntonioNeural");
assert.equal(resolveEdgeVoice("pt-BR-ManuelaNeural"), "pt-BR-FranciscaNeural");
assert.equal(resolveEdgeVoice("pt-BR-NicolauNeural"), "pt-BR-AntonioNeural");
assert.equal(resolveEdgeVoice("pt-BR-ThalitaNeural"), "pt-BR-ThalitaMultilingualNeural");
assert.equal(resolveEdgeVoice("pt-BR-FranciscaNeural"), "pt-BR-FranciscaNeural");
assert.equal(resolveEdgeVoice(""), "pt-BR-FranciscaNeural");
assert.equal(resolveEdgeVoice("x'><break time='10s'/>"), "pt-BR-FranciscaNeural");
assert.equal(resolveEdgeVoice({ name: "pt-BR-FranciscaNeural" }), "pt-BR-FranciscaNeural");

function expectStatus(fn, status, re) {
  try {
    fn();
    assert.fail("expected parseTtsPayload to throw");
  } catch (err) {
    assert.equal(err.status, status);
    if (re) assert.match(String(err.message), re);
  }
}

const ok = parseTtsPayload(JSON.stringify({ text: "  Olá  ", voice: "pt-BR-ValerioNeural" }));
assert.equal(ok.text, "Olá");
assert.equal(ok.voice, "pt-BR-AntonioNeural");

expectStatus(() => parseTtsPayload("{"), 400, /JSON/i);
expectStatus(() => parseTtsPayload(JSON.stringify({ text: { x: 1 }, voice: "pt-BR-FranciscaNeural" })), 400, /string/i);
expectStatus(() => parseTtsPayload(JSON.stringify({ text: "Olá", voice: ["pt-BR-FranciscaNeural"] })), 400, /string/i);
expectStatus(() => parseTtsPayload("x".repeat(5000)), 413, /large/i);
expectStatus(() => parseTtsPayload(JSON.stringify({ text: "" })), 400, /text/i);

const token = generateSecMsGec();
assert.match(token, /^[0-9A-F]{64}$/);
assert.equal(generateSecMsGec(1_700_000_000_000), generateSecMsGec(1_700_000_000_000));

assert.equal(EDGE_TTS_VOICES.length, 3);
assert.ok(EDGE_TTS_VOICES.every((v) => v.id.endsWith("Neural")));

const live = process.argv.includes("--live");
if (live) {
  for (const voice of EDGE_TTS_VOICES) {
    const audio = await edgeTTSSynthesize("Olá", voice.id, { timeoutMs: 12000 });
    assert.ok(audio.length > 1000, `${voice.id} returned too little audio`);
    console.log("ok", voice.id, audio.length, "bytes");
  }
}

console.log("edge-tts tests passed");
