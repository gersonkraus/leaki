import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/utils.js", "utf8");

function grab(name, until) {
  const start = src.indexOf("function " + name);
  assert.ok(start >= 0, name + " missing");
  const end = src.indexOf(until, start);
  assert.ok(end > start, name + " end missing");
  return new Function(src.slice(start, end) + "\nreturn " + name + ";")();
}

const persistableAISettings = grab("persistableAISettings", "\nasync function createParentPin");
const buildParentDigest = grab("buildParentDigest", "\nfunction backupFilename");

const stripped = persistableAISettings({
  pinHash: "abc",
  geminiKeyEnc: "enc",
  geminiKey: "AIza-secret",
  openaiKeyEnc: "oenc",
  openaiKey: "sk-secret",
  provider: "openai",
});
assert.equal(stripped.geminiKey, "");
assert.equal(stripped.openaiKey, "");
assert.equal(stripped.geminiKeyEnc, "enc");
assert.equal(persistableAISettings({ geminiKey: "plain", provider: "native" }).geminiKey, "plain");

const now = Date.parse("2026-08-12T12:00:00Z");
const digest = buildParentDigest(
  [
    {
      date: "2026-08-11T10:00:00Z",
      durationSeconds: 120,
      voiceAttempts: [{ word: "BOLA", spoken: "bota", accuracy: 50 }],
      struggledCards: [{ word: "BOLA", reason: "Voz 50%" }],
    },
    {
      date: "2026-07-01T10:00:00Z",
      durationSeconds: 999,
      struggledCards: [{ word: "VELHA", reason: "antiga" }],
    },
  ],
  [
    { front: "CASA", due: "2026-08-12T00:00:00Z" },
    { front: "PATO", due: "2026-09-01T00:00:00Z" },
  ],
  now,
);

assert.equal(digest.sessions, 1);
assert.equal(digest.minutes, 2);
assert.equal(digest.voiceAvg, 50);
assert.deepEqual(digest.hardWords.map((w) => w.word), ["BOLA"]);
assert.ok(digest.tomorrow.includes("CASA"));
assert.ok(!digest.tomorrow.includes("PATO"));

const study = readFileSync("src/components/StudyView.js", "utf8");
assert.match(study, /recognizeSpeechPt/);
assert.match(study, /Pode ouvir/);
assert.match(readFileSync("src/components/ParentAuthModal.js", "utf8"), /Criar PIN/);
assert.match(readFileSync("src/components/BackupModal.js", "utf8"), /\.leaki/);
assert.match(readFileSync("android/app/src/main/java/app/leaki/srs/SpeechRecPlugin.java", "utf8"), /SpeechRecognizer/);
assert.match(readFileSync("android/app/build.gradle", "utf8"), /versionName "1.1.0"/);

console.log("parent-digest tests passed");
