import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/utils.js", "utf8");

// grab() slices function text and compiles it with new Function().
// The extracted function must stay dependency-free (no module-local helpers,
// no await). Prefer exporting from utils.js if that constraint breaks.
function grab(name, until) {
  const start = src.indexOf("function " + name);
  assert.ok(start >= 0, name + " missing");
  const end = src.indexOf(until, start);
  assert.ok(end > start, name + " end missing");
  return new Function(src.slice(start, end) + "\nreturn " + name + ";")();
}

const persistableAISettings = grab("persistableAISettings", "\nasync function createParentPin");
const buildParentDigest = grab("buildParentDigest", "\nfunction backupFilename");
const resetStart = src.indexOf("function resetParentPin");
const resetEnd = src.indexOf("\nfunction buildParentDigest", resetStart);
assert.ok(resetStart >= 0 && resetEnd > resetStart, "resetParentPin missing");
const resetParentPin = new Function(
  "function setUnlockedPin(){}\n" + src.slice(resetStart, resetEnd) + "\nreturn resetParentPin;",
)();

const stripped = persistableAISettings({
  pinHash: "abc",
  geminiKeyEnc: "enc",
  geminiKey: "AIza-secret",
  openaiKeyEnc: "oenc",
  openaiKey: "sk-secret",
  provider: "openai",
});
assert.equal(Object.prototype.hasOwnProperty.call(stripped, "geminiKey"), false, "sealed geminiKey must be deleted, not blanked");
assert.equal(Object.prototype.hasOwnProperty.call(stripped, "openaiKey"), false, "sealed openaiKey must be deleted, not blanked");
assert.equal(stripped.geminiKeyEnc, "enc");
assert.equal(persistableAISettings({ geminiKey: "plain", provider: "native" }).geminiKey, "plain");

const afterPinSetup = persistableAISettings({
  pinHash: "hash",
  pinSalt: "salt",
  geminiKey: "",
  geminiKeyEnc: "sealed",
  geminiKeyIv: "iv",
});
assert.equal(Object.prototype.hasOwnProperty.call(afterPinSetup, "geminiKey"), false);
assert.equal(afterPinSetup.geminiKeyEnc, "sealed");
assert.ok(
  !(Object.prototype.hasOwnProperty.call(afterPinSetup, "geminiKey") && !afterPinSetup.geminiKeyEnc),
  "PIN setup persistable payload must not trigger empty-string reseal",
);

const reset = resetParentPin({
  pinHash: "hash",
  pinSalt: "salt",
  geminiKeyEnc: "enc",
  geminiKeyIv: "iv",
  openaiKeyEnc: "oenc",
  openaiKeyIv: "oiv",
  geminiKey: "plain",
  provider: "gemini",
});
assert.equal(reset.pinHash, "");
assert.equal(reset.pinSalt, "");
assert.equal(reset.geminiKeyEnc, "");
assert.equal(reset.geminiKey, "");
assert.equal(reset.provider, "gemini");
const mergedAfterReset = Object.assign(
  { pinHash: "old", pinSalt: "old", geminiKeyEnc: "old", geminiKey: "secret" },
  reset,
);
assert.equal(mergedAfterReset.pinHash, "");
assert.equal(mergedAfterReset.geminiKeyEnc, "");

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

const empty = buildParentDigest([], [], now);
assert.equal(empty.sessions, 0);
assert.equal(empty.minutes, 0);
assert.equal(empty.voiceAvg, null);
assert.equal(empty.voiceCount, 0);
assert.deepEqual(empty.hardWords, []);
assert.deepEqual(empty.tomorrow, []);

const weekAgo = now - 7 * 864e5;
const atBoundary = buildParentDigest(
  [{ date: new Date(weekAgo).toISOString(), durationSeconds: 60 }],
  [],
  now,
);
assert.equal(atBoundary.sessions, 1, "session exactly at weekAgo is included");
const beforeBoundary = buildParentDigest(
  [{ date: new Date(weekAgo - 1).toISOString(), durationSeconds: 60 }],
  [],
  now,
);
assert.equal(beforeBoundary.sessions, 0, "session 1ms before weekAgo is excluded");

assert.equal(buildParentDigest([{ date: "2026-08-11T10:00:00Z", durationSeconds: 29 }], [], now).minutes, 0);
assert.equal(buildParentDigest([{ date: "2026-08-11T10:00:00Z", durationSeconds: 30 }], [], now).minutes, 1);
assert.equal(buildParentDigest([{ date: "2026-08-11T10:00:00Z", durationSeconds: 90 }], [], now).minutes, 2);

const tomorrowCutoff = now + 864e5;
const dueExact = buildParentDigest([], [{ front: "LIMITE", due: new Date(tomorrowCutoff).toISOString() }], now);
assert.ok(dueExact.tomorrow.includes("LIMITE"), "due exactly at now+24h is included");
const dueAfter = buildParentDigest([], [{ front: "DEPOIS", due: new Date(tomorrowCutoff + 1000).toISOString() }], now);
assert.ok(!dueAfter.tomorrow.includes("DEPOIS"), "due 1s after now+24h is excluded");

const study = readFileSync("src/components/StudyView.js", "utf8");
assert.match(study, /recognizeSpeechPt/);
assert.match(readFileSync("src/components/ParentAuthModal.js", "utf8"), /createParentPin|Criar PIN/);
assert.match(readFileSync("src/components/BackupModal.js", "utf8"), /shareBackupFile/);
assert.match(readFileSync("android/app/src/main/java/app/leaki/srs/SpeechRecPlugin.java", "utf8"), /public void listen/);
assert.match(readFileSync("android/app/src/main/java/app/leaki/srs/LeakiSharePlugin.java", "utf8"), /shareTextFile/);
assert.match(readFileSync("src/app.js", "utf8"), /!newCfg\.geminiKeyEnc/);

console.log("parent-digest tests passed");
