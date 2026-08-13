import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/utils.js", import.meta.url), "utf8");
const api = new Function(
  src +
    "\nreturn { migrateLearnersState, applyLearnerSwitch, snapshotLearnerBundle, emptyLearnerBundle, sharedParentSecrets, makeNewLearnerBundle, combineLearnerReports, selectReportView, addLearnerToState, renameLearnerInState, learnerDataKey, LEARNERS_KEY, nextLearnerName, generatePairKey, isValidPairKey };"
)();

const {
  migrateLearnersState,
  applyLearnerSwitch,
  snapshotLearnerBundle,
  emptyLearnerBundle,
  sharedParentSecrets,
  makeNewLearnerBundle,
  combineLearnerReports,
  selectReportView,
  addLearnerToState,
  renameLearnerInState,
  learnerDataKey,
  LEARNERS_KEY,
  nextLearnerName,
  generatePairKey,
  isValidPairKey,
} = api;

const fresh = migrateLearnersState(null, {
  pairKey: "leaki_" + "ab".repeat(16),
  enabled: true,
  lastAt: "2026-08-12T10:00:00Z",
});
assert.equal(fresh.learners.length, 1);
assert.equal(fresh.learners[0].name, "Criança 1");
assert.equal(fresh.activeId, fresh.learners[0].id);
assert.equal(fresh.learners[0].pairKey, "leaki_" + "ab".repeat(16));
assert.equal(fresh.learners[0].enabled, true);

const kept = migrateLearnersState(
  {
    activeId: "lrn-b",
    learners: [
      { id: "lrn-a", name: "Ana", pairKey: "leaki_" + "11".repeat(16) },
      { id: "lrn-b", name: "João", pairKey: "leaki_" + "22".repeat(16) },
    ],
  },
  {},
);
assert.equal(kept.activeId, "lrn-b");
assert.equal(kept.learners[0].name, "Ana");
assert.equal(kept.learners[1].name, "João");

const missingActive = migrateLearnersState(
  { activeId: "gone", learners: [{ id: "lrn-a", name: "Ana" }] },
  {},
);
assert.equal(missingActive.activeId, "lrn-a");

const anaBundle = snapshotLearnerBundle({
  decks: [{ id: "d1", name: "Letras" }],
  cards: [{ id: "c1", deckId: "d1", front: "BOLA" }],
  history: [{ date: "2026-08-12T10:00:00Z", deckName: "Letras", accuracy: 50 }],
  aiSettings: { learnerInterests: "gatos", geminiKey: "secret" },
  sync: { pairKey: "leaki_" + "11".repeat(16), enabled: true },
});
const joaoBundle = snapshotLearnerBundle({
  decks: [{ id: "d2", name: "Frases" }],
  cards: [{ id: "c2", deckId: "d2", front: "PATO" }],
  history: [{ date: "2026-08-13T10:00:00Z", deckName: "Frases", accuracy: 90 }],
  aiSettings: { learnerInterests: "dinos" },
  sync: { pairKey: "leaki_" + "22".repeat(16), enabled: true },
});

const switched = applyLearnerSwitch(
  { "lrn-a": anaBundle, "lrn-b": joaoBundle },
  "lrn-a",
  {
    decks: [{ id: "d1", name: "Letras extra" }],
    cards: [{ id: "c1", deckId: "d1", front: "CASA" }],
    history: anaBundle.history,
    aiSettings: { learnerInterests: "gatos" },
    sync: anaBundle.sync,
  },
  "lrn-b",
);
assert.equal(switched.activeId, "lrn-b");
assert.equal(switched.bundle.cards[0].front, "PATO");
assert.equal(switched.bundles["lrn-a"].cards[0].front, "CASA");
assert.equal(switched.bundles["lrn-b"].decks[0].name, "Frases");
assert.ok(!switched.bundle.cards.some((c) => c.front === "CASA"), "troca não pode misturar fichas");

const same = applyLearnerSwitch({ "lrn-a": anaBundle }, "lrn-a", anaBundle, "lrn-a");
assert.equal(same.activeId, "lrn-a");
assert.equal(same.bundle.cards[0].front, "BOLA");

const empty = emptyLearnerBundle();
assert.deepEqual(empty.decks, []);
assert.deepEqual(empty.cards, []);
assert.deepEqual(empty.history, []);

const secrets = sharedParentSecrets({
  pinHash: "h",
  pinSalt: "s",
  geminiKey: "AIza",
  geminiKeyEnc: "enc",
  learnerInterests: "não copiar",
  contentInbox: [{ id: "x" }],
});
assert.equal(secrets.pinHash, "h");
assert.equal(secrets.geminiKey, "AIza");
assert.equal(Object.prototype.hasOwnProperty.call(secrets, "learnerInterests"), false);
assert.equal(Object.prototype.hasOwnProperty.call(secrets, "contentInbox"), false);

const created = makeNewLearnerBundle(
  { pinHash: "h", geminiKey: "AIza", learnerInterests: "gatos", provider: "openai" },
  { pairKey: generatePairKey(), enabled: true },
);
assert.equal(created.decks.length, 0);
assert.equal(created.history.length, 0);
assert.equal(created.aiSettings.pinHash, "h");
assert.equal(created.aiSettings.provider, "openai");
assert.equal(created.aiSettings.learnerInterests || "", "");
assert.ok(isValidPairKey(created.sync.pairKey));

const reports = combineLearnerReports([
  { id: "lrn-a", name: "Ana", history: anaBundle.history, cards: anaBundle.cards, decks: anaBundle.decks },
  { id: "lrn-b", name: "João", history: joaoBundle.history, cards: joaoBundle.cards, decks: joaoBundle.decks },
]);
assert.equal(reports.history.length, 2);
assert.equal(reports.history[0].learnerName, "Ana");
assert.match(reports.history[0].deckName, /Ana/);
assert.match(reports.history[1].deckName, /João/);
assert.equal(reports.cards.length, 2);

const onlyAna = selectReportView("active", {
  history: anaBundle.history,
  cards: anaBundle.cards,
  decks: anaBundle.decks,
}, []);
assert.equal(onlyAna.history.length, 1);
assert.equal(onlyAna.history[0].deckName, "Letras");

const allKids = selectReportView("all", onlyAna, [
  { id: "lrn-a", name: "Ana", history: anaBundle.history, cards: anaBundle.cards, decks: anaBundle.decks },
  { id: "lrn-b", name: "João", history: joaoBundle.history, cards: joaoBundle.cards, decks: joaoBundle.decks },
]);
assert.equal(allKids.history.length, 2);

const added = addLearnerToState(fresh, { name: "João" });
assert.equal(added.state.learners.length, 2);
assert.equal(added.learner.name, "João");
assert.ok(isValidPairKey(added.learner.pairKey));
assert.equal(nextLearnerName(added.state.learners), "Criança 3");

const renamed = renameLearnerInState(added.state, added.learner.id, "  João Pedro  ");
assert.equal(renamed.learners.find((l) => l.id === added.learner.id).name, "João Pedro");
assert.equal(learnerDataKey("lrn-a"), "leaki:learner-data:lrn-a");
assert.equal(LEARNERS_KEY, "leaki:learners");

const panel = readFileSync(new URL("../src/components/StatsPanel.js", import.meta.url), "utf8");
assert.match(panel, /Todas as crianças|reportScope/);
assert.match(panel, /Nova criança|onAddLearner|learners/);

const syncPanel = readFileSync(new URL("../src/components/SyncPanel.js", import.meta.url), "utf8");
assert.match(syncPanel, /Nova criança|onAddLearner/);

const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
assert.match(app, /applyLearnerSwitch|switchLearner/);
assert.match(app, /LEARNERS_KEY|leaki:learners/);

console.log("learners tests passed");
