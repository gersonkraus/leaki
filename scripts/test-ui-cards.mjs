import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles.css", "utf8");
assert.match(css, /\.word-hero\{/);
assert.match(css, /\.flip-card\{[^}]*min-height:18rem/);
assert.match(css, /\.flip-card\{[^}]*height:28rem/);
assert.match(css, /\.ficha-card\{/);
assert.match(css, /\.deck-grid\{/);
assert.match(css, /rotateY\(180deg\)/);

const study = readFileSync("src/components/StudyView.js", "utf8");
assert.match(study, /word-hero/);
assert.match(study, /kid-shell/);
assert.doesNotMatch(study, /h-\[320px\]/);

const build = readFileSync("scripts/build.mjs", "utf8");
assert.match(build, /name="viewport"/);
assert.match(build, /width=device-width/);
assert.match(build, /viewport-fit=cover/);

console.log("ui-cards tests passed");
