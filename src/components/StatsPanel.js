function eParentStats({ history: e, cards: cardsList, decks: decksList, aiSettings: aiCfg, onSaveAISettings: onSaveAI, onApproveCards, onClearHistory: t, onClose: n, syncCfg, onSaveSync, onSyncNow, syncBusy }) {
  let [activeTab, setActiveTab] = (0, c.useState)("stats"),
    [geminiKey, setGeminiKey] = (0, c.useState)(aiCfg?.geminiKey || ""),
    [geminiModel, setGeminiModel] = (0, c.useState)(aiCfg?.geminiModel || "gemini-2.0-flash"),
    [openaiKey, setOpenaiKey] = (0, c.useState)(aiCfg?.openaiKey || ""),
    [openaiModel, setOpenaiModel] = (0, c.useState)(aiCfg?.openaiModel || "gpt-4o-transcribe"),
    [provider, setProvider] = (0, c.useState)(aiCfg?.provider || "native"),
    [savedMsg, setSavedMsg] = (0, c.useState)(null),
    [voices, setVoices] = (0, c.useState)([]),
    [selectedVoice, setSelectedVoice] = (0, c.useState)(""),
    [ttsTestState, setTtsTestState] = (0, c.useState)(""),
    [evalRules, setEvalRules] = (0, c.useState)(() => normalizeEvalRules(aiCfg?.evalRules)),
    r = e.reduce((e, t) => e + (t.durationSeconds || 0), 0),
    a = e.reduce((e, t) => e + (t.totalReviews || 0), 0),
    l = e.reduce((e, t) => e + (t.correctCount || 0), 0),
    i = a > 0 ? Math.round((l / a) * 100) : 0,
    digest = buildParentDigest(e, cardsList || []);

  (0, c.useEffect)(() => {
    function loadVoices() {
      let allVoices = window.speechSynthesis?.getVoices() || [];
      let ptVoices = allVoices.filter(v => v.lang === "pt-BR" || v.lang === "pt_BR" || v.lang === "pt");
      let edgeVoices = getEdgeTTSVoices().map(v => ({
        name: "edge:" + v.id,
        localService: false,
        isEdge: true,
        label: v.label
      }));
      setVoices([...edgeVoices, ...ptVoices]);
      let current = getTTSVoiceName() || aiCfg?.ttsVoice || "";
      setTTSVoice(current);
      setSelectedVoice(getTTSVoiceName());
    }
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  function o(e) {
    if (!e || e < 60) return (e || 0) + "s";
    let t = Math.floor(e / 60),
      n = e % 60;
    return t + "m " + (n < 10 ? "0" : "") + n + "s";
  }

  function handleSaveAIConfig(ev) {
    ev.preventDefault();
    let keyToSave = geminiKey.trim() || aiCfg?.geminiKey || "";
    let openaiToSave = openaiKey.trim() || aiCfg?.openaiKey || "";
    let newCfg = {
      provider,
      geminiKey: keyToSave,
      geminiModel: geminiModel.trim() || "gemini-2.0-flash",
      openaiKey: openaiToSave,
      openaiModel: openaiModel.trim() || "gpt-4o-transcribe",
      ttsVoice: selectedVoice,
      evalRules: normalizeEvalRules(evalRules),
      learnerInterests: aiCfg?.learnerInterests || "",
      learnerDifficulties: aiCfg?.learnerDifficulties || "",
      contentInbox: aiCfg?.contentInbox || []
    };
    if (onSaveAI) onSaveAI(newCfg);
    setSavedMsg("Configurações salvas com sucesso!");
    setTimeout(() => setSavedMsg(null), 3000);
  }

  return (0, u.jsxs)("div", {
    className: "space-y-4 text-sm",
    children: [
      (0, u.jsxs)("div", {
        className: "flex border-b border-base-line gap-4 text-xs font-mono mb-2",
        children: [
          (0, u.jsxs)("button", {
            type: "button",
            onClick: () => setActiveTab("stats"),
            className: "pb-2 border-b-2 font-medium transition-colors " + ("stats" === activeTab ? "border-violet text-white" : "border-transparent text-ink-soft hover:text-ink"),
            children: ["📊 Histórico & Estatísticas"]
          }),
          (0, u.jsxs)("button", {
            type: "button",
            onClick: () => setActiveTab("suggest"),
            className: "pb-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 " + ("suggest" === activeTab ? "border-violet text-white" : "border-transparent text-ink-soft hover:text-ink"),
            children: [
              (0, u.jsx)("span", { children: "✨" }),
              " Sugestões"
            ]
          }),
          (0, u.jsxs)("button", {
            type: "button",
            onClick: () => setActiveTab("sync"),
            className: "pb-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 " + ("sync" === activeTab ? "border-violet text-white" : "border-transparent text-ink-soft hover:text-ink"),
            children: [
              (0, u.jsx)("span", { children: "🔗" }),
              " Sync"
            ]
          }),
          (0, u.jsxs)("button", {
            type: "button",
            onClick: () => setActiveTab("ai"),
            className: "pb-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 " + ("ai" === activeTab ? "border-violet text-white" : "border-transparent text-ink-soft hover:text-ink"),
            children: [
              (0, u.jsx)("span", { children: "🤖" }),
              " IA & Voz"
            ]
          })
        ]
      }),
      (function renderActiveTab() {
        if ("stats" === activeTab) return (0, u.jsxs)("div", {
        className: "space-y-4",
        children: [
          (0, u.jsxs)("div", {
            className: "p-4 rounded-xl bg-violet-dim border border-violet/40 space-y-2",
            children: [
              (0, u.jsx)("p", { className: "font-display font-medium text-white", children: "Esta semana" }),
              (0, u.jsxs)("p", { className: "text-sm text-ink-soft", children: [digest.sessions, " sessões · cerca de ", digest.minutes, " min"] }),
              digest.voiceAvg !== null ? (0, u.jsxs)("p", { className: "text-sm text-white", children: ["Leitura em voz: ", digest.voiceAvg, "% de acerto (", digest.voiceCount, " tentativas)"] }) : (0, u.jsx)("p", { className: "text-sm text-ink-soft", children: "Ainda não houve leitura em voz nesta semana." }),
              digest.hardWords.length ? (0, u.jsxs)("div", {
                children: [
                  (0, u.jsx)("p", { className: "text-xs text-amber font-semibold mt-1", children: "Travou nestas palavras:" }),
                  (0, u.jsx)("p", { className: "text-sm text-white", children: digest.hardWords.map(w => w.word).join(", ") })
                ]
              }) : (0, u.jsx)("p", { className: "text-sm text-teal", children: "Nenhuma palavra marcada como difícil nesta semana." }),
              digest.tomorrow.length ? (0, u.jsxs)("p", { className: "text-sm text-violet-light", children: ["Para estudar em seguida: ", digest.tomorrow.join(", ")] }) : null
            ]
          }),
          (0, u.jsxs)("div", {
            className: "grid grid-cols-3 gap-2.5",
            children: [
              (0, u.jsxs)("div", {
                className: "p-3 rounded-xl bg-base-raised border border-base-line text-center",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Tempo Total" }),
                  (0, u.jsx)("p", { className: "font-display font-semibold text-lg text-white mt-0.5", children: o(r) })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "p-3 rounded-xl bg-base-raised border border-base-line text-center",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Precisão Geral" }),
                  (0, u.jsxs)("p", { className: "font-display font-semibold text-lg text-teal mt-0.5", children: [i, "%"] })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "p-3 rounded-xl bg-base-raised border border-base-line text-center",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Sessões" }),
                  (0, u.jsx)("p", { className: "font-display font-semibold text-lg text-violet-light mt-0.5", children: e.length })
                ]
              })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3",
            children: [
              (0, u.jsxs)("div", {
                className: "flex items-center justify-between",
                children: [
                  (0, u.jsx)("h4", { className: "font-display font-medium text-white flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "📋" }), " Histórico de Estudos"] }),
                  e.length > 0 ? (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => { if (confirm("Deseja zerar todo o histórico de estudos?")) t(); },
                    className: "font-mono text-[10px] text-ink-soft hover:text-coral transition-colors",
                    children: "limpar histórico"
                  }) : null
                ]
              }),
              0 === e.length ? (0, u.jsx)("p", {
                className: "text-xs text-ink-soft py-4 text-center font-mono",
                children: "Nenhuma sessão realizada ainda. As estatísticas aparecerão aqui após cada estudo."
              }) : (0, u.jsx)("div", {
                className: "space-y-2 max-h-64 overflow-y-auto pr-1",
                children: e.slice().reverse().map((e, t) => {
                  let a = e.avgTimePerCard && e.avgTimePerCard < 3,
                    hesCount = e.struggledCards ? e.struggledCards.length : 0,
                    voiceCount = e.voiceAttempts ? e.voiceAttempts.length : 0;
                  return (0, u.jsxs)("div", {
                    className: "p-3 rounded-lg bg-base-raised/60 border border-base-line space-y-2 text-xs",
                    children: [
                      (0, u.jsxs)("div", {
                        className: "flex items-center justify-between gap-3",
                        children: [
                          (0, u.jsxs)("div", {
                            className: "min-w-0",
                            children: [
                              (0, u.jsx)("p", { className: "font-medium text-white truncate text-sm", children: e.deckName || "Baralho" }),
                              (0, u.jsxs)("p", {
                                className: "font-mono text-[10px] text-ink-soft mt-0.5",
                                children: [
                                  new Date(e.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
                                  " · ",
                                  o(e.durationSeconds),
                                  a ? (0, u.jsx)("span", { className: "text-amber ml-1.5", title: "Ritmo rápido", children: "⚠️ Rápido (" + e.avgTimePerCard + "s/card)" }) : (0, u.jsx)("span", { className: "text-ink-soft/60 ml-1.5", children: "(" + (e.avgTimePerCard || "-") + "s/card)" })
                                ]
                              })
                            ]
                          }),
                          (0, u.jsxs)("div", {
                            className: "text-right shrink-0",
                            children: [
                              (0, u.jsxs)("span", {
                                className: "font-mono font-semibold text-sm " + (e.accuracy >= 70 ? "text-teal" : "text-amber"),
                                children: [e.accuracy, "%"]
                              }),
                              (0, u.jsxs)("p", {
                                className: "font-mono text-[10px] text-ink-soft",
                                children: [e.correctCount || 0, " acertos / ", e.totalReviews || 0]
                              })
                            ]
                          })
                        ]
                      }),
                      voiceCount > 0 ? (0, u.jsxs)("div", {
                        className: "p-2 rounded-lg bg-base-surface border border-violet/30 font-mono text-[11px] text-ink-soft space-y-1",
                        children: [
                          (0, u.jsx)("p", { className: "text-violet-light font-medium text-[10px] uppercase", children: "🎙️ Avaliações de Leitura de Voz:" }),
                          (0, u.jsx)("ul", {
                            className: "space-y-0.5 pl-1",
                            children: e.voiceAttempts.map((va, vaIdx) => (0, u.jsxs)("li", {
                              className: "flex items-center justify-between gap-2 border-b border-base-line/30 pb-0.5",
                              children: [
                                (0, u.jsxs)("span", { children: ["• ", (0, u.jsx)("b", { className: "text-white", children: va.word }), ' ➔ "', va.spoken, '"'] }),
                                (0, u.jsxs)("span", { className: "font-semibold " + (va.accuracy >= 80 ? "text-teal" : va.accuracy >= 50 ? "text-amber" : "text-coral"), children: [va.accuracy, "%"] })
                              ]
                            }, vaIdx))
                          })
                        ]
                      }) : null,
                      hesCount > 0 ? (0, u.jsxs)("div", {
                        className: "p-2 rounded-lg bg-base-surface border border-base-line/60 font-mono text-[11px] text-ink-soft space-y-1",
                        children: [
                          (0, u.jsx)("p", { className: "text-amber font-medium text-[10px] uppercase", children: "🔍 Palavras com dúvida/áudio/hesitação:" }),
                          (0, u.jsx)("ul", {
                            className: "space-y-0.5 pl-1",
                            children: e.struggledCards.map((sc, scIdx) => (0, u.jsxs)("li", {
                              className: "text-ink-soft/90 truncate",
                              children: ["• ", (0, u.jsx)("b", { className: "text-white", children: sc.word }), " — ", sc.reason]
                            }, scIdx))
                          })
                        ]
                      }) : null
                    ]
                  }, t);
                })
              })
            ]
          })
        ]
      });
        if ("sync" === activeTab) return (0, u.jsx)(eSyncPanel, {
        syncCfg: syncCfg,
        onSaveSync: onSaveSync,
        onSyncNow: onSyncNow,
        busy: syncBusy
      });
        if ("suggest" === activeTab) return (0, u.jsx)(eContentSuggest, {
        history: e,
        cards: cardsList,
        decks: decksList || [],
        aiCfg: aiCfg,
        onSaveAI: onSaveAI,
        onApproveCards: onApproveCards
      });
        return (0, u.jsxs)("form", {
        onSubmit: handleSaveAIConfig,
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3.5",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white", children: "Motor de Análise de Voz & Leitura" }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Para máxima qualidade, use OpenAI: ele escreve o que a criança falou, sem completar a palavra da tela. O Leaki aplica as regras depois." })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "space-y-2",
            children: [
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setProvider("openai"),
                className: "w-full p-3 rounded-xl border text-left transition-colors " + ("openai" === provider ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                children: [
                  (0, u.jsx)("p", { className: "font-medium text-xs", children: "OpenAI — melhor qualidade (recomendado)" }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Transcrição literal (gpt-4o-transcribe / Whisper). Distingue BOLA de BOTA." })
                ]
              }),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setProvider("gemini"),
                className: "w-full p-3 rounded-xl border text-left transition-colors " + ("gemini" === provider ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                children: [
                  (0, u.jsx)("p", { className: "font-medium text-xs", children: "Google Gemini" }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Ouve o áudio e julga. Bom, mas pode ‘completar’ a palavra. As regras do Leaki limitam isso." })
                ]
              }),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setProvider("native"),
                className: "w-full p-3 rounded-xl border text-left transition-colors " + ("native" === provider ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                children: [
                  (0, u.jsx)("p", { className: "font-medium text-xs", children: "Nativo do aparelho (grátis, offline)" }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Mais rápido. Costuma corrigir a fala e esconder troca de letra." })
                ]
              })
            ]
          }),
          "openai" === provider ? (0, u.jsxs)("div", {
            className: "space-y-3 pt-1",
            children: [
              (0, u.jsxs)("div", {
                className: "space-y-1",
                children: [
                  (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Chave de API da OpenAI" }),
                  (0, u.jsx)("input", {
                    type: "password",
                    value: openaiKey,
                    onChange: e => setOpenaiKey(e.target.value),
                    placeholder: "sk-...",
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors text-white"
                  })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "flex gap-1.5 flex-wrap",
                children: [
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => setOpenaiModel("gpt-4o-transcribe"),
                    className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border " + ("gpt-4o-transcribe" === openaiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft"),
                    children: "gpt-4o-transcribe (melhor)"
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => setOpenaiModel("whisper-1"),
                    className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border " + ("whisper-1" === openaiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft"),
                    children: "whisper-1"
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => setOpenaiModel("gpt-4o-mini-transcribe"),
                    className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border " + ("gpt-4o-mini-transcribe" === openaiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft"),
                    children: "gpt-4o-mini-transcribe"
                  })
                ]
              })
            ]
          }) : null,
          "gemini" === provider ? (0, u.jsxs)("div", {
            className: "space-y-3 pt-1",
            children: [
              (0, u.jsxs)("div", {
                className: "space-y-1",
                children: [
                  (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Chave de API do Google AI Studio (Gemini)" }),
                  (0, u.jsx)("input", {
                    type: "password",
                    value: geminiKey,
                    onChange: e => setGeminiKey(e.target.value),
                    placeholder: "AIzaSy...",
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors text-white"
                  })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "space-y-1.5",
                children: [
                  (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Modelo Gemini (ID do modelo)" }),
                  (0, u.jsx)("input", {
                    type: "text",
                    value: geminiModel,
                    onChange: e => setGeminiModel(e.target.value),
                    placeholder: "gemini-2.0-flash",
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors text-white"
                  }),
                  (0, u.jsxs)("div", {
                    className: "flex gap-1.5 flex-wrap pt-1",
                    children: [
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => setGeminiModel("gemini-2.0-flash"),
                        className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors " + ("gemini-2.0-flash" === geminiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                        children: "gemini-2.0-flash (Recomendado)"
                      }),
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => setGeminiModel("gemini-2.5-flash"),
                        className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors " + ("gemini-2.5-flash" === geminiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                        children: "gemini-2.5-flash"
                      }),
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => setGeminiModel("gemini-1.5-flash"),
                        className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors " + ("gemini-1.5-flash" === geminiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                        children: "gemini-1.5-flash"
                      })
                    ]
                  })
                ]
              })
            ]
          }) : null,
          (0, u.jsxs)("div", {
            className: "space-y-2 pt-2 border-t border-base-line",
            children: [
              (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Limiares da avaliação" }),
              (0, u.jsx)("p", { className: "text-[10px] text-ink-soft/70", children: "A fala manda primeiro. Tempo e dica só abaixam a nota se a leitura já estiver boa. Troca de 1 letra não pode passar da nota máxima." }),
              (0, u.jsxs)("div", { className: "grid grid-cols-3 gap-2", children: [
                (0, u.jsxs)("label", { className: "space-y-1", children: [
                  (0, u.jsx)("span", { className: "text-[10px] text-ink-soft", children: "Boa a partir de %" }),
                  (0, u.jsx)("input", {
                    type: "number", min: 1, max: 100, value: evalRules.voiceGoodMin,
                    onChange: ev => setEvalRules(r => normalizeEvalRules({ ...r, voiceGoodMin: ev.target.value })),
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-2 py-2 text-xs font-mono text-white outline-none focus:border-violet"
                  })
                ]}),
                (0, u.jsxs)("label", { className: "space-y-1", children: [
                  (0, u.jsx)("span", { className: "text-[10px] text-ink-soft", children: "Erro abaixo de %" }),
                  (0, u.jsx)("input", {
                    type: "number", min: 0, max: 99, value: evalRules.voiceHardMin,
                    onChange: ev => setEvalRules(r => normalizeEvalRules({ ...r, voiceHardMin: ev.target.value })),
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-2 py-2 text-xs font-mono text-white outline-none focus:border-violet"
                  })
                ]}),
                (0, u.jsxs)("label", { className: "space-y-1", children: [
                  (0, u.jsx)("span", { className: "text-[10px] text-ink-soft", children: "Máx. 1 letra %" }),
                  (0, u.jsx)("input", {
                    type: "number", min: 0, max: 100, value: evalRules.oneLetterMax,
                    onChange: ev => setEvalRules(r => normalizeEvalRules({ ...r, oneLetterMax: ev.target.value })),
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-2 py-2 text-xs font-mono text-white outline-none focus:border-violet"
                  })
                ]})
              ]}),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setEvalRules(r => ({ ...r, hintForcesHard: !r.hintForcesHard })),
                className: "w-full p-3 rounded-xl border text-left " + (evalRules.hintForcesHard ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft"),
                children: [
                  (0, u.jsx)("p", { className: "text-xs font-medium", children: evalRules.hintForcesHard ? "Dica 🔊 abaixa a nota" : "Dica 🔊 não abaixa a nota" }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Se o baralho tiver dica ligada e a criança ouvir, a leitura boa vira reforço." })
                ]
              }),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setEvalRules(r => ({ ...r, overtimeForcesHard: !r.overtimeForcesHard })),
                className: "w-full p-3 rounded-xl border text-left " + (evalRules.overtimeForcesHard ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft"),
                children: [
                  (0, u.jsx)("p", { className: "text-xs font-medium", children: evalRules.overtimeForcesHard ? "Passar do tempo abaixa a nota" : "Tempo não abaixa a nota" }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Usa o limite de segundos cadastrado em cada ficha." })
                ]
              })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "space-y-2 pt-2 border-t border-base-line",
            children: [
              (0, u.jsxs)("div", {
                children: [
                  (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Voz do TTS (Português BR)" }),
                  (0, u.jsx)("p", { className: "text-[10px] text-ink-soft/70 mt-0.5", children: "Vozes neurais pedem internet na primeira fala. Sem rede, o app usa a voz do aparelho." }),
                  !isOnline() && selectedVoice.startsWith("edge:") ? (0, u.jsx)("p", { className: "text-[10px] text-amber mt-1", children: "Sem internet agora: a voz neural fica em pausa e o aparelho fala no lugar." }) : null
                ]
              }),
              voices.length > 0 ? (0, u.jsxs)("select", {
                value: selectedVoice,
                onChange: e => {
                  let name = e.target.value;
                  setSelectedVoice(name);
                  setTTSVoice(name);
                  setTtsTestState("");
                  if (onSaveAI) onSaveAI({
                    provider,
                    geminiKey: geminiKey.trim() || aiCfg?.geminiKey || "",
                    geminiModel: geminiModel.trim() || "gemini-2.0-flash",
                    openaiKey: openaiKey.trim() || aiCfg?.openaiKey || "",
                    openaiModel: openaiModel.trim() || "gpt-4o-transcribe",
                    ttsVoice: name,
                    evalRules: normalizeEvalRules(evalRules)
                  });
                },
                className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors text-white",
                children: [
                  (0, u.jsx)("option", { value: "", children: "Automática (voz do aparelho)" }),
                  voices.map(v => {
                    let label = v.isEdge
                      ? (v.label || v.name.replace("edge:", "").replace("pt-BR-", "").replace("Neural", " (Neural)"))
                      : v.name + (v.localService ? " (local)" : " (navegador)");
                    return (0, u.jsx)("option", { value: v.name, children: label }, v.name);
                  })
                ]
              }) : (0, u.jsx)("p", { className: "text-[10px] text-ink-soft/60 font-mono", children: "Nenhuma voz em português encontrada no navegador." }),
              (0, u.jsx)("button", {
                type: "button",
                disabled: ttsTestState === "loading",
                onClick: async () => {
                  setTtsTestState("loading");
                  try {
                    await speakWordTTS("Olá! Esta é uma demonstração da voz selecionada.");
                    setTtsTestState("ok");
                    setTimeout(() => setTtsTestState(s => s === "ok" ? "" : s), 2500);
                  } catch (err) {
                    setTtsTestState("error");
                  }
                },
                className: "font-mono text-[10px] px-3 py-1.5 rounded-lg border border-base-line text-ink-soft hover:text-violet-light hover:border-violet transition-colors disabled:opacity-50",
                children: ttsTestState === "loading" ? "⏳ Gerando voz neural…" : "🔊 Testar voz"
              }),
              ttsTestState === "ok" ? (0, u.jsx)("p", { className: "text-[10px] text-teal font-mono", children: "Voz pronta. Repetições desta frase saem do cache." }) : null,
              ttsTestState === "error" ? (0, u.jsx)("p", { className: "text-[10px] text-coral font-mono", children: "Não foi possível gerar a voz neural. Verifique a internet ou use a voz automática." }) : null
            ]
          }),
          savedMsg ? (0, u.jsx)("div", { className: "p-2 rounded-lg bg-teal-dim text-teal font-mono text-xs", children: savedMsg }) : null,
          (0, u.jsx)("div", {
            className: "flex justify-end pt-2",
            children: (0, u.jsx)("button", {
              type: "submit",
              className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white hover:bg-violet-light transition-colors shadow-[0_4px_16px_rgba(110,86,207,0.3)]",
              children: "Salvar Configurações de IA"
            })
          })
        ]
      });
      })(),
      (0, u.jsx)("div", {
        className: "flex justify-end pt-1",
        children: (0, u.jsx)("button", {
          type: "button",
          onClick: n,
          className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised text-ink-soft hover:text-ink hover:bg-base-strong transition-colors",
          children: "Fechar"
        })
      })
    ]
  });
}

