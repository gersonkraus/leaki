import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/utils.js", "utf8");
const end = src.indexOf("const EDGE_TTS_VOICES");
assert.ok(end > 0, "eval block not found");
const api = new Function(
  src.slice(0, end) +
    "\nfunction feedbackFromAccuracy(acc){return acc>=80?'ok':'bad';}\nreturn { calculateSpeechAccuracy, rateSpeechAndTime, rateManualAndTime, normalizeEvalRules, refineGeminiEvaluation, buildGeminiEvalPrompt };",
)();

const {
  calculateSpeechAccuracy,
  rateSpeechAndTime,
  rateManualAndTime,
  normalizeEvalRules,
  refineGeminiEvaluation,
  buildGeminiEvalPrompt,
} = api;

const defaults = normalizeEvalRules();
assert.equal(defaults.voiceGoodMin, 80);
assert.equal(defaults.voiceHardMin, 50);
assert.equal(defaults.oneLetterMax, 60);
assert.equal(defaults.hintForcesHard, true);
assert.equal(defaults.overtimeForcesHard, true);

assert.equal(rateSpeechAndTime(100, 3, 0, 7).rating, "good");
assert.equal(rateSpeechAndTime(90, 9, 0, 7).rating, "hard");
assert.equal(rateSpeechAndTime(95, 3, 1, 7).rating, "hard");
assert.equal(rateSpeechAndTime(60, 3, 0, 7).rating, "hard");
assert.equal(rateSpeechAndTime(20, 2, 0, 7).rating, "again");
assert.equal(rateSpeechAndTime(100, 30, 0, 7).rating, "hard");

assert.equal(rateSpeechAndTime(100, 3, 0, 7, { hintForcesHard: true }).rating, "good", "dica off (0 plays) does not penalize");
assert.equal(rateSpeechAndTime(100, 3, 1, 7, { hintForcesHard: true }).rating, "hard", "dica on + 1 play penalizes");
assert.equal(rateSpeechAndTime(100, 3, 1, 7, { hintForcesHard: false }).rating, "good", "admin can disable hint penalty");
assert.equal(rateSpeechAndTime(100, 12, 0, 7, { overtimeForcesHard: false }).rating, "good", "admin can disable time penalty");
assert.equal(rateSpeechAndTime(85, 3, 0, 7, { voiceGoodMin: 90 }).rating, "hard", "custom good threshold");
assert.equal(rateSpeechAndTime(40, 3, 0, 7, { voiceHardMin: 30 }).rating, "hard", "custom fail threshold");

assert.equal(rateManualAndTime("again", 4, 0, 7).rating, "again");
assert.equal(rateManualAndTime("good", 3, 0, 7).rating, "good");
assert.equal(rateManualAndTime("good", 9, 0, 7).rating, "hard");
assert.equal(rateManualAndTime("good", 3, 1, 7).rating, "hard");
assert.equal(rateManualAndTime("good", 3, 0, 7, { overtimeForcesHard: false }).rating, "good");
assert.equal(rateManualAndTime("good", 3, 2, 7, { hintForcesHard: false }).rating, "good");

assert.equal(calculateSpeechAccuracy("bola", "BOLA"), 100);
assert.ok(calculateSpeechAccuracy("bota", "BOLA") <= 60, "1 letter swap capped at 60");
assert.equal(calculateSpeechAccuracy("bota", "BOLA"), 60);
assert.ok(calculateSpeechAccuracy("casa", "BOLA") < 50);
assert.equal(calculateSpeechAccuracy("bota", "BOLA", { oneLetterMax: 40 }), 40);

const refined = refineGeminiEvaluation(
  { spokenText: "bota", accuracyScore: 95, feedback: "excelente" },
  "BOLA",
);
assert.equal(refined.spokenText, "bota");
assert.ok(refined.accuracy <= 60, "Gemini cannot inflate a 1-letter error");
assert.equal(refined.isAI, true);

const exact = refineGeminiEvaluation({ spokenText: "bola", accuracyScore: 100 }, "BOLA");
assert.equal(exact.accuracy, 100);

const prompt = buildGeminiEvalPrompt("BOLA", { oneLetterMax: 60, voiceGoodMin: 80, voiceHardMin: 50 });
assert.match(prompt, /Não complete/);
assert.match(prompt, /BOTA/);
assert.match(prompt, /60/);

const form = readFileSync("src/components/DeckForm.js", "utf8");
assert.match(form, /requireSpeechToFlip/);
const app = readFileSync("src/app.js", "utf8");
assert.match(app, /requireSpeechToFlip: !!requireSpeech/);
const study = readFileSync("src/components/StudyView.js", "utf8");
assert.match(study, /mustSpeak/);
assert.match(study, /evalRules/);
assert.match(study, /audioHintEnabled \?/);
assert.match(study, /rateManualAndTime/);
assert.match(study, /analyzeWithGemini\([^\)]*evalRules/);
const panel = readFileSync("src/components/StatsPanel.js", "utf8");
assert.match(panel, /Limiares da avaliação/);
assert.match(panel, /oneLetterMax/);
assert.match(src, /transcribeWithOpenAI/);
assert.match(src, /gpt-4o-transcribe/);
assert.match(src, /scoreLiteralTranscript/);
assert.match(study, /useOpenAI/);
assert.match(panel, /OpenAI — melhor qualidade/);

console.log("study-rate tests passed");
