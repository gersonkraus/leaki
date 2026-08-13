import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles.css", "utf8");
assert.match(css, /\.word-hero\{/);
assert.match(css, /\.flip-card\{[^}]*min-height:18rem/);
assert.match(css, /\.ficha-card\{/);
assert.match(css, /\.deck-grid\{/);
assert.match(css, /rotateY\(180deg\)/);

const study = readFileSync("src/components/StudyView.js", "utf8");
assert.match(study, /word-hero/);
assert.match(study, /kid-shell/);
assert.doesNotMatch(study, /h-\[320px\]/);

const html = readFileSync("leaki.html", "utf8");
assert.match(html, /name="viewport"/);
assert.match(html, /width=device-width/);
assert.match(html, /word-hero/);

console.log("ui-cards tests passed");
