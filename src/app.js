
if (!document.querySelector('meta[name="viewport"]')) {
  let vp = document.createElement("meta");
  vp.name = "viewport";
  vp.content = "width=device-width, initial-scale=1, viewport-fit=cover";
  document.head.appendChild(vp);
}
let eg = document.createElement("link");
eg.rel = "stylesheet";
eg.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
document.head.appendChild(eg);

(0, d.createRoot)(document.getElementById("root")).render(
  (0, u.jsx)(c.StrictMode, {
    children: (0, u.jsx)(function() {
      let [e, t] = (0, c.useState)([]),
        [n, r] = (0, c.useState)([]),
        [a, l] = (0, c.useState)(!1),
        [i, o] = (0, c.useState)("list"),
        [s, d] = (0, c.useState)(null),
        [f, p] = (0, c.useState)(null),
        [h, m] = (0, c.useState)(null),
        [kBackup, setKBackup] = (0, c.useState)(!1),
        [kStats, setKStats] = (0, c.useState)(!1),
        [isParentMode, setIsParentMode] = (0, c.useState)(!1),
        [showParentAuth, setShowParentAuth] = (0, c.useState)(!1),
        [history, setHistory] = (0, c.useState)([]),
        [aiSettings, setAISettings] = (0, c.useState)({ provider: "native", geminiKey: "", geminiModel: "gemini-2.0-flash", ttsVoice: "" }),
        [syncCfg, setSyncCfg] = (0, c.useState)(defaultSyncConfig),
        [syncBusy, setSyncBusy] = (0, c.useState)(!1),
        g = (0, c.useRef)([]);
      let syncCfgRef = (0, c.useRef)(syncCfg);
      let dataRef = (0, c.useRef)({ decks: e, cards: n, history, aiSettings });
      let syncingRef = (0, c.useRef)(!1);
      let skipPushRef = (0, c.useRef)(!0);
      syncCfgRef.current = syncCfg;
      dataRef.current = { decks: e, cards: n, history, aiSettings };

      (0, c.useEffect)(() => {
        (async () => {
          let defaults = { provider: "native", geminiKey: "", geminiModel: "gemini-2.0-flash", ttsVoice: "" };
          let [e, n, h, ai, syncSaved] = await Promise.all([ee(en, []), ee(er, []), ee(ehistory, []), ee(eaisettings, defaults), ee(esync, defaultSyncConfig())]);
          let cfg = ai || defaults;
          setTTSVoice(cfg.ttsVoice || "");
          t(e), r(n), setHistory(h), setAISettings(cfg);
          if (syncSaved) setSyncCfg(Object.assign({}, defaultSyncConfig(), syncSaved));
          l(!0);
        })();
      }, []);

      (0, c.useEffect)(() => {
        a && et(en, e);
      }, [e, a]);

      (0, c.useEffect)(() => {
        a && et(er, n);
      }, [n, a]);

      (0, c.useEffect)(() => {
        a && et(ehistory, history);
      }, [history, a]);

      (0, c.useEffect)(() => {
        a && et(eaisettings, persistableAISettings(aiSettings));
      }, [aiSettings, a]);

      (0, c.useEffect)(() => {
        a && et(esync, syncCfg);
      }, [syncCfg, a]);

      async function runSync(reason) {
        let cfg = syncCfgRef.current;
        if (!cfg.enabled || !isValidPairKey(cfg.pairKey) || !isOnline()) return;
        if (syncingRef.current) return;
        syncingRef.current = !0;
        setSyncBusy(!0);
        try {
          let local = dataRef.current;
          let remote = await pullSyncSnapshot(cfg.syncUrl, cfg.pairKey);
          let merged = remote.snapshot
            ? mergeSyncSnapshot({
              decks: local.decks,
              cards: local.cards,
              history: local.history,
              aiSettings: local.aiSettings
            }, remote.snapshot)
            : {
              decks: local.decks,
              cards: local.cards,
              history: local.history,
              aiSettings: local.aiSettings
            };
          if (!snapshotsLookSame(local, merged)) {
            skipPushRef.current = !0;
            t(merged.decks);
            r(merged.cards);
            setHistory(merged.history);
            setAISettings(prev => mergeAiSettingsForSync(prev, merged.aiSettings));
            if (merged.aiSettings && merged.aiSettings.ttsVoice != null) setTTSVoice(merged.aiSettings.ttsVoice || "");
          }
          let payload = snapshotForSync(merged.decks, merged.cards, merged.history, merged.aiSettings);
          let saved;
          try {
            saved = await pushSyncSnapshot(cfg.syncUrl, cfg.pairKey, remote.rev, payload);
          } catch (err) {
            if (err && err.message === "sync-conflict" && err.remote) {
              let again = mergeSyncSnapshot(merged, err.remote.snapshot);
              skipPushRef.current = !0;
              t(again.decks);
              r(again.cards);
              setHistory(again.history);
              setAISettings(prev => mergeAiSettingsForSync(prev, again.aiSettings));
              saved = await pushSyncSnapshot(cfg.syncUrl, cfg.pairKey, err.remote.rev, snapshotForSync(again.decks, again.cards, again.history, again.aiSettings));
            } else {
              throw err;
            }
          }
          setSyncCfg(prev => Object.assign({}, prev, {
            rev: saved.rev,
            lastAt: saved.updatedAt || new Date().toISOString(),
            lastError: "",
            lastStatus: reason || "ok"
          }));
        } catch (err) {
          setSyncCfg(prev => Object.assign({}, prev, {
            lastError: err && err.message ? err.message : String(err),
            lastStatus: "erro"
          }));
        } finally {
          syncingRef.current = !1;
          skipPushRef.current = !1;
          setSyncBusy(!1);
        }
      }

      (0, c.useEffect)(() => {
        if (!a) return;
        let boot = setTimeout(() => runSync("boot"), 500);
        return () => clearTimeout(boot);
      }, [a, syncCfg.enabled, syncCfg.pairKey]);

      let aiSyncStamp = (aiSettings.learnerInterests || "") + "|" + (aiSettings.learnerDifficulties || "") + "|" + ((aiSettings.contentInbox || []).map(item => item.id + ":" + item.status).join(","));

      (0, c.useEffect)(() => {
        if (!a || skipPushRef.current || !syncCfg.enabled) return;
        let tmr = setTimeout(() => runSync("local"), 1600);
        return () => clearTimeout(tmr);
      }, [e, n, history, aiSyncStamp, a, syncCfg.enabled]);

      (0, c.useEffect)(() => {
        if (!a || !syncCfg.enabled) return;
        let id = setInterval(() => runSync("poll"), 20000);
        return () => clearInterval(id);
      }, [a, syncCfg.enabled, syncCfg.pairKey]);

      (0, c.useEffect)(() => {
        function onOnline() { runSync("online"); }
        window.addEventListener("online", onOnline);
        return () => window.removeEventListener("online", onOnline);
      }, []);

      function handleSaveSessionStats(record) {
        setHistory(prev => [...prev, record]);
      }

      function handleClearHistory() {
        setHistory([]);
      }

      function handleApproveSuggestedCards(items) {
        if (!items || !items.length) return;
        r(prev => {
          let next = prev.slice();
          items.forEach(item => {
            if (!item || !item.deckId || !String(item.front || "").trim()) return;
            next.push(buildNewCard({
              deckId: item.deckId,
              front: String(item.front).trim(),
              back: String(item.back || "").trim(),
              frontAudio: item.frontAudio,
              backAudio: item.backAudio,
              readingTime: item.readingTime || suggestionReadingTime(item.kind)
            }));
          });
          return next;
        });
      }

      async function handleSaveAISettings(newCfg) {
        let merged = Object.assign({}, aiSettings, newCfg);
        if (newCfg && Object.prototype.hasOwnProperty.call(newCfg, "geminiKey") && !newCfg.geminiKeyEnc) {
          merged = await sealGeminiKey(merged, newCfg.geminiKey);
        }
        if (newCfg && Object.prototype.hasOwnProperty.call(newCfg, "openaiKey") && !newCfg.openaiKeyEnc) {
          merged = await sealOpenaiKey(merged, newCfg.openaiKey);
        }
        setAISettings(merged);
        if (newCfg && Object.prototype.hasOwnProperty.call(newCfg, "ttsVoice")) setTTSVoice(newCfg.ttsVoice || "");
      }

      function handleToggleParentMode() {
        if (isParentMode) {
          setIsParentMode(!1);
        } else {
          setShowParentAuth(!0);
        }
      }

      function handleImport(importedData, mode) {
        let newDecks = Array.isArray(importedData.decks) ? importedData.decks : [];
        let newCards = Array.isArray(importedData.cards) ? importedData.cards : [];
        let newHist = Array.isArray(importedData.history) ? importedData.history : [];
        let newAI = importedData.aiSettings || null;
        if ("replace" === mode) {
          t(newDecks);
          r(newCards);
          setHistory(newHist);
          if (newAI) {
            setAISettings(newAI);
            if (newAI.ttsVoice != null) setTTSVoice(newAI.ttsVoice);
          }
        } else {
          t(prevDecks => {
            let map = new Map();
            prevDecks.forEach(d => map.set(d.id, d));
            newDecks.forEach(d => map.set(d.id, { ...map.get(d.id), ...d }));
            return Array.from(map.values());
          });
          r(prevCards => {
            let map = new Map();
            prevCards.forEach(c => map.set(c.id, c));
            newCards.forEach(c => map.set(c.id, { ...map.get(c.id), ...c }));
            return Array.from(map.values());
          });
          setHistory(prevHist => {
            let existingDates = new Set(prevHist.map(h => h.date));
            let filtered = newHist.filter(h => !existingDates.has(h.date));
            return [...prevHist, ...filtered];
          });
          if (newAI && (newAI.geminiKey || newAI.ttsVoice || newAI.provider)) {
            setAISettings(prev => ({ ...prev, ...newAI }));
            if (newAI.ttsVoice != null) setTTSVoice(newAI.ttsVoice);
          }
        }
      }

      let y = e.find(e => e.id === s) ?? null,
        v = n.filter(e => e.deckId === s).sort((e, t) => e.front.localeCompare(t.front));

      return a ? (0, u.jsxs)("div", {
        className: "min-h-screen catalog-scrollbar kid-app",
        children: [
          "list" === i && (0, u.jsx)(el, {
            decks: e,
            cards: n,
            isParentMode: isParentMode,
            onToggleParentMode: handleToggleParentMode,
            onOpenDeck: e => { d(e), o("deck"); },
            onEditDeck: e => p({ mode: "edit", deck: e }),
            onDeleteDeck: function(e) {
              confirm("Excluir este baralho e todas as suas fichas?") && (
                t(t => t.filter(t => t.id !== e)),
                r(t => t.filter(t => t.deckId !== e)),
                s === e && (d(null), o("list"))
              );
            },
            onNewDeck: () => p({ mode: "new" }),
            onOpenBackup: () => setKBackup(!0),
            onOpenStats: () => setKStats(!0)
          }),
          "deck" === i && y && (0, u.jsx)(es, {
            deck: y,
            cards: v,
            isParentMode: isParentMode,
            onBack: () => o("list"),
            onStudy: function() { g.current = v.filter(X), o("study"); },
            onNewCard: () => m({ mode: "new" }),
            onEditCard: e => m({ mode: "edit", card: e }),
            onDeleteCard: function(e) {
              confirm("Excluir esta ficha?") && r(t => t.filter(t => t.id !== e));
            }
          }),
          "study" === i && y && (0, u.jsx)(ed, {
            deck: y,
            dueCards: g.current,
            aiSettings: aiSettings,
            onSaveSession: handleSaveSessionStats,
            onRate: function(e, t) {
              r(n => n.map(n => {
                let r, a;
                return n.id === e.id ? (
                  r = new Date,
                  a = G.repeat(Y(n), r)[K[t]].card,
                  {
                    ...n,
                    due: a.due.toISOString(),
                    stability: a.stability,
                    difficulty: a.difficulty,
                    elapsed_days: a.elapsed_days,
                    scheduled_days: a.scheduled_days,
                    learning_steps: a.learning_steps,
                    reps: a.reps,
                    lapses: a.lapses,
                    state: a.state,
                    last_review: a.last_review ? a.last_review.toISOString() : null
                  }
                ) : n;
              }));
            },
            onExit: () => o("deck")
          }),
          showParentAuth && (0, u.jsx)(ParentAuthModal, {
            lock: aiSettings,
            onSaveLock: handleSaveAISettings,
            onSuccess: unlocked => {
              setShowParentAuth(!1);
              setIsParentMode(!0);
              if (unlocked) setAISettings(unlocked);
            },
            onClose: () => setShowParentAuth(!1)
          }),
          f && (0, u.jsx)(ef, {
            title: "new" === f.mode ? "Novo baralho" : "Editar baralho",
            onClose: () => p(null),
            children: (0, u.jsx)(ep, {
              initial: "edit" === f.mode ? f.deck : void 0,
              onCancel: () => p(null),
              onSave: (e, n, audioHint, skipRec, requireSpeech) => {
                var r;
                let a;
                return "new" === f.mode ? (
                  a = { id: ea(), name: e, description: n, audioHintEnabled: !!audioHint, skipRecordingEnabled: !!skipRec, requireSpeechToFlip: !!requireSpeech, createdAt: new Date().toISOString() },
                  void(t(e => [...e, a]), p(null))
                ) : (
                  r = f.deck.id,
                  void(t(t => t.map(t => t.id === r ? { ...t, name: e, description: n, audioHintEnabled: !!audioHint, skipRecordingEnabled: !!skipRec, requireSpeechToFlip: !!requireSpeech } : t)), p(null))
                );
              }
            })
          }),
          h && (0, u.jsx)(ef, {
            title: "new" === h.mode ? "Nova ficha" : "Editar ficha",
            onClose: () => m(null),
            children: (0, u.jsx)(em, {
              initial: "edit" === h.mode ? h.card : void 0,
              onCancel: () => m(null),
              onSave: (frontText, backText, frontAud, backAud, readingTimeSec) => {
                var l;
                return "new" === h.mode ? function(frontText, backText, frontAud, backAud, readingTimeSec) {
                  if (!s) return;
                  r(e => [...e, buildNewCard({
                    deckId: s,
                    front: frontText,
                    back: backText,
                    frontAudio: frontAud,
                    backAudio: backAud,
                    readingTime: readingTimeSec || 7
                  })]), m(null);
                }(frontText, backText, frontAud, backAud, readingTimeSec) : (
                  l = h.card.id,
                  void(r(r => r.map(r => r.id === l ? {
                    ...r,
                    front: frontText,
                    back: backText,
                    frontAudio: frontAud,
                    backAudio: backAud,
                    readingTime: readingTimeSec || 7
                  } : r)), m(null))
                );
              }
            })
          }),
          kBackup && (0, u.jsx)(ef, {
            title: "Backup & Restauração",
            onClose: () => setKBackup(!1),
            children: (0, u.jsx)(eBackup, {
              decks: e,
              cards: n,
              history: history,
              aiSettings: aiSettings,
              onImport: handleImport,
              onClose: () => setKBackup(!1)
            })
          }),
          kStats && (0, u.jsx)(ef, {
            title: "Painel dos Pais · Relatório & IA",
            onClose: () => setKStats(!1),
            children: (0, u.jsx)(eParentStats, {
              history: history,
              cards: n,
              decks: e,
              aiSettings: aiSettings,
              onSaveAISettings: handleSaveAISettings,
              onApproveCards: handleApproveSuggestedCards,
              onClearHistory: handleClearHistory,
              onClose: () => setKStats(!1),
              syncCfg: syncCfg,
              onSaveSync: next => setSyncCfg(prev => Object.assign({}, prev, next)),
              onSyncNow: () => runSync("manual"),
              syncBusy: syncBusy
            })
          })
        ]
      }) : (0, u.jsx)("div", {
        className: "min-h-screen flex items-center justify-center bg-base",
        children: (0, u.jsx)("p", {
          className: "font-mono text-xs uppercase tracking-wide text-ink-soft",
          children: "Carregando seus baralhos…"
        })
      });
    }, {})
  })
);
