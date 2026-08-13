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
assert.match(readFileSync("src/components/Modal.js", "utf8"), /aria-modal/);

console.log("ui-cards tests passed");
