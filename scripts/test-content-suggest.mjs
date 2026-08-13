import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/utils.js", "utf8");
assert.ok(src.indexOf("function pickContentSuggestBackend") >= 0, "pickContentSuggestBackend missing");
assert.ok(src.indexOf("function buildLearnerEvidence") >= 0, "buildLearnerEvidence missing");
assert.ok(src.indexOf("function requestContentSuggestions") >= 0, "requestContentSuggestions missing");

const api = new Function(
  src +
    "\nreturn { buildLearnerEvidence, canRequestContentSuggestions, parseContentSuggestions, buildContentSuggestPrompt, pickContentSuggestBackend, pruneContentInbox, suggestionReadingTime, parseJsonLoose };"
)();

const {
  buildLearnerEvidence,
  canRequestContentSuggestions,
  parseContentSuggestions,
  buildContentSuggestPrompt,
  pickContentSuggestBackend,
  pruneContentInbox,
  suggestionReadingTime,
  parseJsonLoose,
} = api;

const now = Date.parse("2026-08-12T12:00:00Z");
const evidence = buildLearnerEvidence(
  [
    {
      date: "2026-08-11T10:00:00Z",
      durationSeconds: 120,
      deckName: "Letra B",
      voiceAttempts: [
        { word: "BOLA", spoken: "bota", accuracy: 50 },
        { word: "PATO", spoken: "pato", accuracy: 100 },
      ],
      struggledCards: [{ word: "BOLA", reason: "Voz 50%" }],
    },
  ],
  [
    { front: "BOLA", deckId: "d1" },
    { front: "CASA", deckId: "d1" },
  ],
  [{ id: "d1", name: "Letra B" }],
  { interests: "dinossauros", difficulties: "troca B/P" },
  now,
);

assert.equal(evidence.interests, "dinossauros");
assert.equal(evidence.difficulties, "troca B/P");
assert.deepEqual(evidence.hardWords.map((w) => w.word), ["BOLA"]);
assert.equal(evidence.confusions[0].expected, "BOLA");
assert.equal(evidence.confusions[0].spoken, "bota");
assert.ok(evidence.existingFronts.includes("BOLA"));
assert.ok(canRequestContentSuggestions(evidence));
assert.equal(canRequestContentSuggestions(buildLearnerEvidence([], [], [], {}, now)), false);
assert.ok(canRequestContentSuggestions(buildLearnerEvidence([], [], [], { interests: "gatos" }, now)));

const parsed = parseContentSuggestions(
  {
    suggestions: [
      { kind: "word", front: "BOTA", back: "calçado", reason: "troca BOLA→BOTA 50%", basedOn: ["BOLA"] },
      { kind: "phrase", front: "A bola rola.", back: "", reason: "reusa BOLA", basedOn: ["BOLA"] },
      { kind: "word", front: "bola", back: "dup", reason: "duplicata da ficha existente" },
      { kind: "text", front: "", reason: "vazia" },
      { kind: "other", front: "PTERODÁCTILO", reason: "interesse" },
    ],
  },
  evidence.existingFronts,
);
assert.equal(parsed.length, 3);
assert.equal(parsed[0].kind, "word");
assert.equal(parsed[0].front, "BOTA");
assert.equal(parsed[1].kind, "phrase");
assert.equal(parsed[2].kind, "word");
assert.equal(parsed[2].front, "PTERODÁCTILO");
assert.ok(!parsed.some((item) => item.front.toLowerCase() === "bola"));

const prompt = buildContentSuggestPrompt(evidence);
assert.match(prompt, /BOLA/);
assert.match(prompt, /dinossauros/);
assert.match(prompt, /troca B\/P/);
assert.match(prompt, /Não invente/);
assert.match(prompt, /frentesJaCadastradas/);

assert.equal(pickContentSuggestBackend({ provider: "native" }), null);
assert.equal(pickContentSuggestBackend({ provider: "native", geminiKey: "AIza" }), "gemini");
assert.equal(pickContentSuggestBackend({ provider: "gemini", geminiKey: "AIza" }), "gemini");
assert.equal(pickContentSuggestBackend({ provider: "native", openaiKey: "sk" }), "openai");
assert.equal(pickContentSuggestBackend({ provider: "openai", openaiKey: "sk", geminiKey: "AIza" }), "openai");
assert.equal(suggestionReadingTime("phrase"), 12);
assert.equal(suggestionReadingTime("text"), 20);
assert.equal(suggestionReadingTime("word"), 7);

const inbox = pruneContentInbox([
  { id: "1", status: "pending" },
  { id: "2", status: "inserted" },
  { id: "3", status: "discarded" },
]);
assert.equal(inbox.filter((i) => i.status === "pending").length, 1);
assert.deepEqual(parseJsonLoose("prefix {\"suggestions\":[1]} suffix"), { suggestions: [1] });

const panel = readFileSync("src/components/ContentSuggestPanel.js", "utf8");
assert.match(panel, /Liberar/);
assert.match(panel, /Pedir sugestões à IA/);
assert.doesNotMatch(panel, /onApproveCards\(\s*result/);
assert.match(readFileSync("src/app.js", "utf8"), /buildNewCard/);
assert.match(src, /x-goog-api-key/);
assert.doesNotMatch(src, /generateContent\?key=/);
assert.match(readFileSync("scripts/build.mjs", "utf8"), /ContentSuggestPanel/);

console.log("content-suggest tests passed");
