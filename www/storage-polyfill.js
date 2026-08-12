/**
 * Polyfill for Claude Artifact `window.storage` used by Leaki.
 *
 * App contract (from minified bundle):
 *   await window.storage.get(key, secure?) → { value: string } | null/undefined
 *   await window.storage.set(key, value, secure?) → truthy on success
 *
 * Uses IndexedDB (handles audio data-URLs) with localStorage fallback/migration.
 */
(function () {
  'use strict';

  if (window.storage && typeof window.storage.get === 'function' && typeof window.storage.set === 'function') {
    return;
  }

  var PREFIX = 'leaki:';
  var DB_NAME = 'leaki-storage';
  var STORE = 'kv';
  var DB_VERSION = 1;
  var dbPromise = null;
  var hasIDB = typeof indexedDB !== 'undefined';

  function openDb() {
    if (!hasIDB) return Promise.reject(new Error('IndexedDB unavailable'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        dbPromise = null;
        reject(req.error || new Error('IndexedDB open failed'));
      };
    });
    return dbPromise;
  }

  function idbGet(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var r = tx.objectStore(STORE).get(key);
        r.onsuccess = function () {
          resolve(r.result === undefined ? null : r.result);
        };
        r.onerror = function () {
          reject(r.error);
        };
      });
    });
  }

  function idbSet(key, value) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        var r = tx.objectStore(STORE).put(value, key);
        r.onsuccess = function () {
          resolve(true);
        };
        r.onerror = function () {
          reject(r.error);
        };
      });
    });
  }

  function idbDelete(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        var r = tx.objectStore(STORE).delete(key);
        r.onsuccess = function () {
          resolve(true);
        };
        r.onerror = function () {
          reject(r.error);
        };
      });
    });
  }

  function lsGet(key) {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch (e) {
      return null;
    }
  }

  function lsSet(key, value) {
    localStorage.setItem(PREFIX + key, value);
    return true;
  }

  function lsRemove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      /* ignore */
    }
  }

  window.storage = {
    /**
     * @param {string} key
     * @param {boolean} [_secure] ignored (artifact API flag)
     * @returns {Promise<{value: string}|null>}
     */
    get: function (key, _secure) {
      return (async function () {
        try {
          if (hasIDB) {
            var value = await idbGet(key);
            if (value == null) {
              var legacy = lsGet(key);
              if (legacy != null) {
                try {
                  await idbSet(key, legacy);
                } catch (e) {
                  /* keep serving legacy */
                }
                value = legacy;
              }
            }
            if (value == null) return null;
            return { value: String(value) };
          }
          var ls = lsGet(key);
          return ls == null ? null : { value: ls };
        } catch (e) {
          console.warn('[leaki storage] get failed', key, e);
          var fallback = lsGet(key);
          return fallback == null ? null : { value: fallback };
        }
      })();
    },

    /**
     * @param {string} key
     * @param {string} value
     * @param {boolean} [_secure]
     * @returns {Promise<boolean>}
     */
    set: function (key, value, _secure) {
      return (async function () {
        var str = String(value);
        try {
          if (hasIDB) {
            await idbSet(key, str);
            return true;
          }
          lsSet(key, str);
          return true;
        } catch (e) {
          console.warn('[leaki storage] set (primary) failed', key, e);
          try {
            lsSet(key, str);
            return true;
          } catch (e2) {
            console.warn('[leaki storage] set (fallback) failed', key, e2);
            return false;
          }
        }
      })();
    },

    /**
     * Optional helper (not used by the bundle today).
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    delete: function (key) {
      return (async function () {
        try {
          if (hasIDB) await idbDelete(key);
          lsRemove(key);
          return true;
        } catch (e) {
          lsRemove(key);
          return false;
        }
      })();
    },
  };

  console.info('[leaki storage] polyfill active (IndexedDB' + (hasIDB ? '' : ' unavailable → localStorage') + ')');
})();
