import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/utils.js", "utf8");
assert.ok(src.indexOf("function pickContentSuggestBackend") >= 0, "pickContentSuggestBackend missing");
assert.ok(src.indexOf("function buildLearnerEvidence") >= 0, "buildLearnerEvidence missing");
assert.ok(src.indexOf("function requestContentSuggestions") >= 0, "requestContentSuggestions missing");

const api = new Function(
  src +
    "\nreturn { buildLearnerEvidence, canRequestContentSuggestions, parseContentSuggestions, buildContentSuggestPrompt, buildContentSuggestUserMessage, resolveSuggestSystemPrompt, interpolateSuggestPrompt, buildSuggestPromptVars, formatSuggestLogs, skillSlug, DEFAULT_SUGGEST_SYSTEM_PROMPT, pickContentSuggestBackend, pruneContentInbox, collapseDuplicateCards, cardDedupeKey, suggestionReadingTime, parseJsonLoose };"
)();

const {
  buildLearnerEvidence,
  canRequestContentSuggestions,
  parseContentSuggestions,
  buildContentSuggestPrompt,
  buildContentSuggestUserMessage,
  resolveSuggestSystemPrompt,
  interpolateSuggestPrompt,
  buildSuggestPromptVars,
  formatSuggestLogs,
  skillSlug,
  DEFAULT_SUGGEST_SYSTEM_PROMPT,
  pickContentSuggestBackend,
  pruneContentInbox,
  collapseDuplicateCards,
  suggestionReadingTime,
  parseJsonLoose,
} = api;

const now = Date.parse("2026-08-12T12:00:00Z");
const evidence = buildLearnerEvidence(
  [
    {
      date: "2026-07-01T10:00:00Z",
      durationSeconds: 60,
      struggledCards: [{ word: "PIPA", reason: "Voz 40%" }],
    },
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
assert.ok(evidence.hardWords.map((w) => w.word).includes("BOLA"));
assert.ok(evidence.hardWords.map((w) => w.word).includes("PIPA"), "logs antigos entram na evidência");
assert.equal(evidence.sessionsAll, 2);
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
assert.ok(parsed[1].back, "verso vazio deve ser preenchido com o motivo");
assert.equal(parsed[2].kind, "word");
assert.equal(parsed[2].front, "PTERODÁCTILO");
assert.ok(!parsed.some((item) => item.front.toLowerCase() === "bola"));

assert.match(DEFAULT_SUGGEST_SYSTEM_PROMPT, /\{\{dificuldades\}\}/);
assert.match(DEFAULT_SUGGEST_SYSTEM_PROMPT, /\{\{interesses\}\}/);
assert.match(DEFAULT_SUGGEST_SYSTEM_PROMPT, /\{\{logs\}\}/);
assert.match(DEFAULT_SUGGEST_SYSTEM_PROMPT, /\{\{skills\}\}/);
assert.match(DEFAULT_SUGGEST_SYSTEM_PROMPT, /Escreva aqui as suas regras/);
assert.doesNotMatch(DEFAULT_SUGGEST_SYSTEM_PROMPT, /NAVE|LAMA|RATO|PROIBIDOS/);
assert.equal(resolveSuggestSystemPrompt(""), DEFAULT_SUGGEST_SYSTEM_PROMPT);
assert.equal(resolveSuggestSystemPrompt("  meu prompt  "), "meu prompt");
assert.equal(skillSlug("Verso Igual"), "verso-igual");

const vars = buildSuggestPromptVars(evidence, [
  { name: "verso-igual", text: "back copia front", enabled: true },
]);
assert.match(vars.dificuldades, /troca B\/P/);
assert.match(vars.interesses, /dinossauros/);
assert.match(vars.logs, /BOLA/);
assert.match(vars.skills, /back copia front/);
assert.equal(
  interpolateSuggestPrompt("Dif: {{dificuldades}} | {{skill:verso-igual}}", vars),
  "Dif: troca B/P | back copia front",
);

const userMsg = buildContentSuggestUserMessage(evidence);
assert.match(userMsg, /troca B\/P/);
assert.match(userMsg, /dinossauros/);
assert.match(userMsg, /PIPA/);

const prompt = buildContentSuggestPrompt(evidence);
assert.match(prompt, /BOLA/);
assert.match(prompt, /dinossauros/);
assert.match(prompt, /troca B\/P/);
assert.doesNotMatch(prompt, /NAVE|PROIBIDOS/);

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
assert.match(panel, /suggestSystemPrompt|Prompt do sistema/);
assert.match(panel, /\{\{logs\}\}/);
assert.match(panel, /Adicionar skill/);
assert.match(panel, /Liberar todas/);
assert.deepEqual(
  collapseDuplicateCards([
    { id: "1", deckId: "d1", front: "NAVE", reps: 0 },
    { id: "2", deckId: "d1", front: "nave", reps: 0 },
    { id: "3", deckId: "d2", front: "NAVE", reps: 0 },
  ]).map((c) => c.id).sort(),
  ["1", "3"],
);
assert.equal(pruneContentInbox([
  { id: "a", status: "pending", front: "NAVE" },
  { id: "b", status: "pending", front: "nave" },
]).length, 1);
assert.doesNotMatch(panel, /onApproveCards\(\s*result/);
assert.match(readFileSync("src/app.js", "utf8"), /buildNewCard/);
assert.match(src, /x-goog-api-key/);
assert.doesNotMatch(src, /generateContent\?key=/);
assert.match(readFileSync("scripts/build.mjs", "utf8"), /ContentSuggestPanel/);

console.log("content-suggest tests passed");
