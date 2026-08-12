function eParentStats({ history: e, aiSettings: aiCfg, onSaveAISettings: onSaveAI, onClearHistory: t, onClose: n }) {
  let [activeTab, setActiveTab] = (0, c.useState)("stats"),
    [geminiKey, setGeminiKey] = (0, c.useState)(aiCfg?.geminiKey || ""),
    [geminiModel, setGeminiModel] = (0, c.useState)(aiCfg?.geminiModel || "gemini-2.0-flash"),
    [provider, setProvider] = (0, c.useState)(aiCfg?.provider || "native"),
    [savedMsg, setSavedMsg] = (0, c.useState)(null),
    r = e.reduce((e, t) => e + (t.durationSeconds || 0), 0),
    a = e.reduce((e, t) => e + (t.totalReviews || 0), 0),
    l = e.reduce((e, t) => e + (t.correctCount || 0), 0),
    i = a > 0 ? Math.round((l / a) * 100) : 0;

  function o(e) {
    if (!e || e < 60) return (e || 0) + "s";
    let t = Math.floor(e / 60),
      n = e % 60;
    return t + "m " + (n < 10 ? "0" : "") + n + "s";
  }

  function handleSaveAIConfig(ev) {
    ev.preventDefault();
    let newCfg = { provider, geminiKey: geminiKey.trim(), geminiModel: geminiModel.trim() || "gemini-2.0-flash" };
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
            onClick: () => setActiveTab("ai"),
            className: "pb-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 " + ("ai" === activeTab ? "border-violet text-white" : "border-transparent text-ink-soft hover:text-ink"),
            children: [
              (0, u.jsx)("span", { children: "🤖" }),
              " IA & Reconhecimento de Voz"
            ]
          })
        ]
      }),
      "stats" === activeTab ? (0, u.jsxs)("div", {
        className: "space-y-4",
        children: [
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
      }) : (0, u.jsxs)("form", {
        onSubmit: handleSaveAIConfig,
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3.5",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white", children: "Motor de Análise de Voz & Leitura" }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Escolha como o aplicativo deve analisar a pronúncia e a leitura em voz alta do seu filho." })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "grid grid-cols-2 gap-2",
            children: [
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setProvider("native"),
                className: "p-3 rounded-xl border text-left transition-colors " + ("native" === provider ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                children: [
                  (0, u.jsx)("p", { className: "font-medium text-xs flex items-center gap-1", children: [(0, u.jsx)("span", { children: "⚡" }), " Nativo (Grátis)"] }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Reconhecimento de voz embutido no celular/PC com análise fonética instantânea." })
                ]
              }),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setProvider("gemini"),
                className: "p-3 rounded-xl border text-left transition-colors " + ("gemini" === provider ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                children: [
                  (0, u.jsx)("p", { className: "font-medium text-xs flex items-center gap-1", children: [(0, u.jsx)("span", { children: "✨" }), " Google Gemini LLM"] }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Avaliação pedagógica inteligente por IA com modelos Gemini mais recentes." })
                ]
              })
            ]
          }),
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
      }),
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

