import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("src/utils.js", "utf8");
const match = src.match(/function rateSpeechAndTime\([\s\S]*?\n\}\n\nconst EDGE_TTS_VOICES/);
assert.ok(match, "rateSpeechAndTime not found in utils.js");
const rateSpeechAndTime = new Function(match[0].replace(/\n\nconst EDGE_TTS_VOICES/, "\nreturn rateSpeechAndTime;"))();

assert.equal(rateSpeechAndTime(100, 3, 0, 7).rating, "good");
assert.equal(rateSpeechAndTime(90, 9, 0, 7).rating, "hard");
assert.equal(rateSpeechAndTime(95, 3, 1, 7).rating, "hard");
assert.equal(rateSpeechAndTime(60, 3, 0, 7).rating, "hard");
assert.equal(rateSpeechAndTime(20, 2, 0, 7).rating, "again");
assert.equal(rateSpeechAndTime(100, 30, 0, 7).rating, "hard");
assert.match(rateSpeechAndTime(40, 4, 0, 7).reason, /incorreta/);

const form = readFileSync("src/components/DeckForm.js", "utf8");
assert.match(form, /requireSpeechToFlip/);
assert.match(form, /Falar para virar/);
const app = readFileSync("src/app.js", "utf8");
assert.match(app, /requireSpeechToFlip: !!requireSpeech/);
const study = readFileSync("src/components/StudyView.js", "utf8");
assert.match(study, /mustSpeak/);
assert.match(study, /revealAfterSpeech/);
assert.match(study, /Fale a palavra primeiro/);

console.log("study-rate tests passed");
