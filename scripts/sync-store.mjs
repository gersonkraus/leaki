import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { join } from "node:path";

export const PAIR_KEY_RE = /^leaki_[a-f0-9]{32}$/;
export const MAX_SYNC_BYTES = 1_500_000;

export function normalizePairKey(raw) {
  return String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
}

export function isValidPairKey(raw) {
  return PAIR_KEY_RE.test(normalizePairKey(raw));
}

export function hashPairKey(raw) {
  let key = normalizePairKey(raw);
  if (!isValidPairKey(key)) throw new Error("invalid-key");
  return createHash("sha256").update(key).digest("hex");
}

export function sanitizeSnapshot(input) {
  let src = input && typeof input === "object" ? input : {};
  let decks = Array.isArray(src.decks) ? src.decks.filter((d) => d && d.id) : [];
  let cards = Array.isArray(src.cards)
    ? src.cards.filter((c) => c && c.id && c.front).map((c) => {
      let copy = Object.assign({}, c);
      if (copy.frontAudio && String(copy.frontAudio).startsWith("data:")) delete copy.frontAudio;
      if (copy.backAudio && String(copy.backAudio).startsWith("data:")) delete copy.backAudio;
      return copy;
    })
    : [];
  let history = Array.isArray(src.history) ? src.history.filter(Boolean) : [];
  let aiSettings = src.aiSettings && typeof src.aiSettings === "object" ? Object.assign({}, src.aiSettings) : {};
  delete aiSettings.geminiKey;
  delete aiSettings.openaiKey;
  return {
    version: 2,
    appName: "Leaki",
    exportedAt: src.exportedAt || new Date().toISOString(),
    decks,
    cards,
    history,
    aiSettings
  };
}

export function createSyncStore(dir) {
  mkdirSync(dir, { recursive: true });

  function pathFor(key) {
    return join(dir, hashPairKey(key) + ".json");
  }

  function read(key) {
    let file = pathFor(key);
    if (!existsSync(file)) return null;
    try {
      let doc = JSON.parse(readFileSync(file, "utf8"));
      if (!doc || typeof doc !== "object") return null;
      return {
        rev: Number(doc.rev) || 0,
        updatedAt: doc.updatedAt || "",
        snapshot: sanitizeSnapshot(doc.snapshot)
      };
    } catch (e) {
      return null;
    }
  }

  function put(key, incomingRev, snapshot) {
    let current = read(key);
    let expected = Number(incomingRev);
    if (!Number.isFinite(expected) || expected < 0) expected = 0;
    if (current && current.rev !== expected) {
      return { ok: false, conflict: true, doc: current };
    }
    let next = {
      rev: (current ? current.rev : 0) + 1,
      updatedAt: new Date().toISOString(),
      snapshot: sanitizeSnapshot(snapshot)
    };
    let file = pathFor(key);
    let tmp = file + ".tmp";
    writeFileSync(tmp, JSON.stringify(next));
    renameSync(tmp, file);
    return { ok: true, conflict: false, doc: next };
  }

  return { read, put };
}
