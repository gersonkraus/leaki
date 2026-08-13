import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles.css", "utf8");
assert.match(css, /\.word-hero\{/);
assert.match(css, /\.flip-card\{[^}]*min-height:18rem/);
assert.match(css, /\.flip-card\{[^}]*height:28rem/);
assert.match(css, /\.ficha-card\{/);
assert.match(css, /\.deck-grid\{/);
assert.match(css, /rotateY\(180deg\)/);
assert.match(css, /\.admin-dialog\{/);
assert.match(css, /\.admin-body\{[^}]*overflow-y:auto/);
assert.match(css, /max-height:min\(92dvh,56rem\)/);

const study = readFileSync("src/components/StudyView.js", "utf8");
assert.match(study, /word-hero/);
assert.match(study, /kid-shell/);
assert.doesNotMatch(study, /h-\[320px\]/);

const build = readFileSync("scripts/build.mjs", "utf8");
assert.match(build, /name="viewport"/);
assert.match(build, /width=device-width/);
assert.match(build, /viewport-fit=cover/);
assert.match(readFileSync("src/app.js", "utf8"), /wide: !0/);
assert.match(readFileSync("src/components/StatsPanel.js", "utf8"), /admin-layout/);
assert.match(css, /\.learner-bar\{/);
assert.match(readFileSync("src/components/StatsPanel.js", "utf8"), /Todas as crianças/);
assert.match(readFileSync("src/components/Modal.js", "utf8"), /aria-modal/);

const decks = readFileSync("src/components/DeckList.js", "utf8");
const detail = readFileSync("src/components/DeckDetail.js", "utf8");
const form = readFileSync("src/components/DeckForm.js", "utf8");

assert.match(css, /\.deck-grid\{[^}]*align-items:\s*start/);
assert.match(css, /\.tap-min\{[^}]*min-height:\s*3rem/);
assert.match(css, /\.status-ok/);
assert.match(css, /\.status-due/);

assert.match(decks, /Novo baralho/);
assert.match(decks, /Restaurar backup/);
assert.match(decks, /Mais/);
assert.doesNotMatch(decks, /Acesse a Área dos Pais para criar/);

assert.match(detail, /isParent && e\.back/);
assert.match(detail, /palavras/);
assert.doesNotMatch(detail, /fichas cadastradas/);
assert.match(detail, /isParent[\s\S]*ei\[t\]/);

assert.doesNotMatch(study, /useState\(!wasMicExplained\(\)\)/);
assert.match(study, /aria-hidden/);
assert.match(study, /Você leu/);
assert.doesNotMatch(study, /Palavras para reforçar/);
assert.doesNotMatch(study, /v\.good \|\| "depois"/);
assert.doesNotMatch(study, /de novo já/);

assert.match(form, /aria-pressed/);
assert.match(form, /aria-label/);

console.log("ui-cards tests passed");
