#!/usr/bin/env node
/**
 * Build script: assembles src/ files into leaki.html
 * 
 * Usage: node scripts/build.mjs
 * 
 * Structure of leaki.html:
 *   Line 1: <!DOCTYPE html><html lang=en><style>CSS</style>
 *   Line 2: <div id=root></div>
 *   Line 3: <script type="module">VENDOR + FSRS</script>...<script type="module">APP</script>
 * 
 * The vendor (React/ReactDOM/FSRS) and app code are kept in the same
 * <script type="module"> block so they share scope (global vars like c, u, d, G, etc.).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

function read(name) {
  return readFileSync(join(src, name), 'utf8').trim();
}

function readComponent(name) {
  return readFileSync(join(src, 'components', name), 'utf8').trim();
}

// --- Read source files ---
const css = read('styles.css');
const vendor = read('vendor.js');
const utils = read('utils.js');

// Components (in dependency order)
const parentAuthModal = readComponent('ParentAuthModal.js');
const backupModal = readComponent('BackupModal.js');
const statsPanel = readComponent('StatsPanel.js');
const deckList = readComponent('DeckList.js');
const deckDetail = readComponent('DeckDetail.js');
const studyView = readComponent('StudyView.js');
const modal = readComponent('Modal.js');
const deckForm = readComponent('DeckForm.js');
const audioRecorder = readComponent('AudioRecorder.js');
const cardForm = readComponent('CardForm.js');

const app = read('app.js');

// --- Assemble ---
const html = `<!DOCTYPE html><html lang=en><style>${css}</style>
    <div id=root></div>
    <script type="module">${vendor}
${utils}
${parentAuthModal}
${backupModal}
${statsPanel}
${deckList}
${deckDetail}
${studyView}
${modal}
${deckForm}
${audioRecorder}
${cardForm}
${app}
</script>
</html>`;

const dest = join(root, 'leaki.html');
writeFileSync(dest, html);
console.log(`Built ${dest} (${html.length} bytes, ${html.split('\n').length} lines)`);
