import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSyncStore, isValidPairKey, normalizePairKey, sanitizeSnapshot } from "./sync-store.mjs";
import { createLeakiServer, allowOrigin } from "./leaki-server.mjs";

const src = readFileSync(new URL("../src/utils.js", import.meta.url), "utf8");
const api = new Function(
  src +
    "\nreturn { generatePairKey, isValidPairKey, normalizePairKey, mergeSyncSnapshot, snapshotForSync, stripCardMedia, mergeAiSettingsForSync, resolveSyncBase, DEFAULT_SYNC_HOST };"
)();

assert.equal(api.DEFAULT_SYNC_HOST, "https://leaki.gerson.com");
assert.equal(api.resolveSyncBase(""), "https://leaki.gerson.com");
assert.equal(api.resolveSyncBase("https://leaki.gerson.com/"), "https://leaki.gerson.com");
const key = api.generatePairKey();
assert.ok(api.isValidPairKey(key));
assert.ok(isValidPairKey(key));
assert.equal(isValidPairKey("abc"), false);
assert.equal(normalizePairKey("  LEAKI_AA" + "bb".repeat(15) + "  ").startsWith("leaki_"), true);

const merged = api.mergeSyncSnapshot(
  {
    decks: [{ id: "d1", name: "Local" }],
    cards: [{ id: "c1", front: "BOLA", frontAudio: "data:audio/mpeg;base64,xx", deckId: "d1" }],
    history: [{ date: "2026-08-11T10:00:00Z", accuracy: 50 }],
    aiSettings: { geminiKey: "AIza-secret", provider: "gemini" }
  },
  {
    decks: [{ id: "d2", name: "Remoto" }],
    cards: [{ id: "c1", front: "BOLA", deckId: "d1" }, { id: "c2", front: "PATO", deckId: "d2" }],
    history: [{ date: "2026-08-12T10:00:00Z", accuracy: 80 }],
    aiSettings: { geminiKey: "", provider: "openai", learnerInterests: "gatos" }
  }
);
assert.equal(merged.decks.length, 2);
assert.equal(merged.cards.length, 2);
assert.equal(merged.cards.find((c) => c.id === "c1").frontAudio, "data:audio/mpeg;base64,xx");
assert.equal(merged.history.length, 2);
assert.equal(merged.aiSettings.geminiKey, "AIza-secret");
assert.equal(merged.aiSettings.learnerInterests, "gatos");

const inboxMerged = api.mergeAiSettingsForSync(
  {
    contentInbox: [
      { id: "sug-1", status: "discarded", front: "CASA" },
      { id: "sug-2", status: "pending", front: "MESA" }
    ]
  },
  {
    contentInbox: [
      { id: "sug-1", status: "pending", front: "CASA" },
      { id: "sug-2", status: "pending", front: "MESA" }
    ]
  }
);
assert.equal(inboxMerged.contentInbox.filter((i) => i.front === "CASA").length, 1);
assert.equal(inboxMerged.contentInbox.find((i) => i.front === "CASA").status, "discarded");
assert.equal(inboxMerged.contentInbox.find((i) => i.id === "sug-2").status, "pending");

const keptProfile = api.mergeAiSettingsForSync(
  {
    learnerInterests: "dinossauros",
    learnerDifficulties: "troca B/P",
    suggestSystemPrompt: "prompt customizado do adulto",
    suggestSkills: [{ id: "verso-igual", name: "verso-igual", text: "back copia front", enabled: true }]
  },
  {
    learnerInterests: "",
    learnerDifficulties: "",
    suggestSystemPrompt: "",
    suggestSkills: []
  }
);
assert.equal(keptProfile.learnerInterests, "dinossauros");
assert.equal(keptProfile.learnerDifficulties, "troca B/P");
assert.equal(keptProfile.suggestSystemPrompt, "prompt customizado do adulto");
assert.equal(keptProfile.suggestSkills.length, 1);
assert.equal(keptProfile.suggestSkills[0].name, "verso-igual");

const newerClears = api.mergeAiSettingsForSync(
  {
    learnerInterests: "gatos",
    suggestSystemPrompt: "antigo",
    suggestProfileAt: "2026-08-12T10:00:00.000Z"
  },
  {
    learnerInterests: "",
    suggestSystemPrompt: "",
    suggestProfileAt: "2026-08-13T10:00:00.000Z"
  }
);
assert.equal(newerClears.learnerInterests, "");
assert.equal(newerClears.suggestSystemPrompt, "");

const olderEmptyLoses = api.mergeAiSettingsForSync(
  {
    learnerInterests: "gatos",
    suggestSystemPrompt: "fica",
    suggestProfileAt: "2026-08-13T12:00:00.000Z"
  },
  {
    learnerInterests: "",
    suggestSystemPrompt: "",
    suggestProfileAt: "2026-08-12T12:00:00.000Z"
  }
);
assert.equal(olderEmptyLoses.learnerInterests, "gatos");
assert.equal(olderEmptyLoses.suggestSystemPrompt, "fica");

const snap = api.snapshotForSync(
  [{ id: "d1", name: "A" }],
  [{ id: "c1", front: "BOLA", frontAudio: "data:audio/mpeg;base64,xx" }],
  [],
  { pinHash: "h", geminiKey: "AIza", geminiKeyEnc: "enc" }
);
assert.equal(Object.prototype.hasOwnProperty.call(snap.cards[0], "frontAudio"), false);
assert.equal(Object.prototype.hasOwnProperty.call(snap.aiSettings, "geminiKey"), false);

const dir = mkdtempSync(join(tmpdir(), "leaki-sync-"));
const store = createSyncStore(dir);
assert.equal(store.read(key), null);
const first = store.put(key, 0, { decks: [{ id: "d1", name: "A" }], cards: [], history: [], aiSettings: { geminiKey: "nope" } });
assert.equal(first.ok, true);
assert.equal(first.doc.rev, 1);
assert.equal(first.doc.snapshot.aiSettings.geminiKey, undefined);
const clash = store.put(key, 0, { decks: [] });
assert.equal(clash.conflict, true);
assert.equal(clash.doc.rev, 1);
const ok2 = store.put(key, 1, { decks: [{ id: "d1", name: "B" }] });
assert.equal(ok2.doc.rev, 2);
assert.throws(() => store.read("bad"), /invalid-key/);

const www = mkdtempSync(join(tmpdir(), "leaki-www-"));
writeFileSync(join(www, "index.html"), "<html>ok</html>");
const dataDir = mkdtempSync(join(tmpdir(), "leaki-data-"));
const server = createLeakiServer({ www, dataDir });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const base = "http://127.0.0.1:" + port;

const health = await (await fetch(base + "/health")).json();
assert.equal(health.ok, true);
assert.equal((await fetch(base + "/")).status, 200);
assert.equal((await fetch(base + "/sync/nope")).status, 400);
assert.equal((await fetch(base + "/sync/" + key)).status, 404);
assert.equal(allowOrigin("https://leaki.gersonkraus.com"), "https://leaki.gersonkraus.com");
assert.equal((await fetch(base + "/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 400);

const put1 = await fetch(base + "/sync/" + key, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rev: 0, snapshot: { decks: [{ id: "d1", name: "Site" }], cards: [], history: [] } })
});
assert.equal(put1.status, 200);
const saved = await put1.json();
assert.equal(saved.rev, 1);

const conflict = await fetch(base + "/sync/" + key, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rev: 0, snapshot: { decks: [] } })
});
assert.equal(conflict.status, 409);

const got = await (await fetch(base + "/sync/" + key)).json();
assert.equal(got.snapshot.decks[0].name, "Site");

const key2 = api.generatePairKey();
const put2 = await fetch(base + "/sync/" + key2, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rev: 0, snapshot: { decks: [{ id: "d2", name: "Celular2" }], cards: [{ id: "c2", front: "PATO" }], history: [] } })
});
assert.equal(put2.status, 200);
const gotA = await (await fetch(base + "/sync/" + key)).json();
const gotB = await (await fetch(base + "/sync/" + key2)).json();
assert.equal(gotA.snapshot.decks[0].name, "Site", "chave A não pode receber o conteúdo da B");
assert.equal(gotB.snapshot.decks[0].name, "Celular2");
assert.equal((gotA.snapshot.cards || []).length, 0);
assert.equal(gotB.snapshot.cards[0].front, "PATO");

const panel = readFileSync(new URL("../src/components/SyncPanel.js", import.meta.url), "utf8");
assert.match(panel, /leaki\.gerson\.com/);
assert.match(readFileSync(new URL("../src/app.js", import.meta.url), "utf8"), /runSync/);
assert.match(readFileSync(new URL("../scripts/build.mjs", import.meta.url), "utf8"), /SyncPanel/);

server.close();
console.log("sync tests passed");
