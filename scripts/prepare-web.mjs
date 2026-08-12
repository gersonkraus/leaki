#!/usr/bin/env node
/**
 * Copy leaki.html → www/index.html, local fonts, and storage polyfill for Android.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'leaki.html');
const www = join(root, 'www');
const dest = join(www, 'index.html');
const polyfillSrc = join(root, 'www', 'storage-polyfill.js');

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap';

const STORAGE_POLYFILL_TAG =
  '<script src="storage-polyfill.js"></script>';

if (!existsSync(src)) {
  console.error('Missing leaki.html at project root');
  process.exit(1);
}
if (!existsSync(join(www, 'fonts.css'))) {
  console.error('Missing www/fonts.css — run scripts that embed fonts first');
  process.exit(1);
}
if (!existsSync(polyfillSrc)) {
  console.error('Missing www/storage-polyfill.js');
  process.exit(1);
}

mkdirSync(www, { recursive: true });
let html = readFileSync(src, 'utf8');

if (!html.includes(GOOGLE_FONTS_URL)) {
  console.warn('Google Fonts URL not found in leaki.html; writing copy as-is');
} else {
  html = html.replaceAll(GOOGLE_FONTS_URL, 'fonts.css');
}

// Ensure a static link exists early (before React boots) for faster first paint.
if (!html.includes('<link rel="stylesheet" href="fonts.css">')) {
  html = html.replace(
    '</style>',
    '</style><link rel="stylesheet" href="fonts.css">',
  );
}

// Inject storage polyfill BEFORE the app module so window.storage exists on boot.
if (!html.includes('storage-polyfill.js')) {
  if (html.includes('<script type="module">')) {
    html = html.replace(
      '<script type="module">',
      `${STORAGE_POLYFILL_TAG}<script type="module">`,
    );
  } else if (html.includes('<script type=module>')) {
    html = html.replace(
      '<script type=module>',
      `${STORAGE_POLYFILL_TAG}<script type=module>`,
    );
  } else {
    console.warn('App module script not found; prepending polyfill after <body>');
    html = html.replace('<body>', `<body>${STORAGE_POLYFILL_TAG}`);
  }
}

writeFileSync(dest, html);
console.log(
  `Prepared ${dest} (${html.length} bytes, local fonts + storage polyfill)`,
);
