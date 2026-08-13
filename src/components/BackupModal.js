function eBackup({ decks: e, cards: t, history: histList, aiSettings: aiCfg, onImport: n, onClose: r }) {
  let [a, l] = (0, c.useState)(!1);
  let [i, o] = (0, c.useState)(!1);
  let [s, d] = (0, c.useState)("");
  let [f, p] = (0, c.useState)(null);
  let [h, m] = (0, c.useState)("merge");
  let [g, y] = (0, c.useState)(null);
  let [v, b] = (0, c.useState)(null);
  let x = (0, c.useRef)(null);

  let w = (0, c.useMemo)(() => t.filter(e => e.frontAudio || e.backAudio).length, [t]);

  function k() {
    return JSON.stringify({
      version: 2,
      appName: "Leaki",
      exportedAt: new Date().toISOString(),
      decks: e,
      cards: t,
      history: histList || [],
      aiSettings: persistableAISettings(aiCfg || {})
    }, null, 2);
  }

  function S() {
    shareBackupFile(k(), backupFilename()).then(kind => {
      y(kind === "shared" ? "Backup enviado. Abra no outro celular e toque em Importar." : "Arquivo .leaki baixado. Envie para o outro aparelho e importe lá.");
      b(null);
    }).catch(err => b("Não foi possível compartilhar: " + (err && err.message ? err.message : err)));
  }

  async function _() {
    try {
      let e = k();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(e);
      } else {
        let t = document.createElement("textarea");
        t.value = e;
        document.body.appendChild(t);
        t.select();
        document.execCommand("copy");
        document.body.removeChild(t);
      }
      l(!0);
      y("JSON copiado para a área de transferência!");
      b(null);
      setTimeout(() => l(!1), 3000);
    } catch (e) {
      b("Não foi possível copiar: " + e.message);
    }
  }

  function E(e) {
    try {
      let t = JSON.parse(e);
      let n = Array.isArray(t) ? t : (t.decks || []);
      let r = Array.isArray(t.cards) ? t.cards : [];
      let h = Array.isArray(t.history) ? t.history : [];
      let ai = t.aiSettings || {};
      if (!Array.isArray(n)) n = [];
      if (!Array.isArray(r)) r = [];
      if (!Array.isArray(h)) h = [];
      if (0 === n.length && 0 === r.length) {
        throw new Error("O arquivo não contém baralhos nem fichas válidos.");
      }
      return { decks: n, cards: r, history: h, aiSettings: ai, exportedAt: t.exportedAt };
    } catch (e) {
      throw new Error("JSON inválido: " + e.message);
    }
  }

  function N(e) {
    let t = e.target.files && e.target.files[0];
    if (!t) return;
    let n = new FileReader();
    n.onload = e => {
      try {
        let t = E(e.target.result);
        p(t);
        y(null);
        b(null);
      } catch (e) {
        b(e.message);
        p(null);
      }
    };
    n.onerror = () => b("Falha ao ler o arquivo selecionado.");
    n.readAsText(t);
    e.target.value = "";
  }

  function C() {
    if (!s.trim()) return;
    try {
      let e = E(s);
      p(e);
      y(null);
      b(null);
    } catch (e) {
      b(e.message);
      p(null);
    }
  }

  function z() {
    if (!f) return;
    try {
      n(f, h);
      r();
    } catch (e) {
      b("Erro ao importar: " + e.message);
    }
  }

  return (0, u.jsxs)("div", {
    className: "space-y-4 text-sm",
    children: [
      (0, u.jsxs)("div", {
        className: "flex items-center justify-between p-3 rounded-xl bg-base-raised/70 border border-base-line font-mono text-[11px] text-ink-soft",
        children: [
          (0, u.jsxs)("span", { children: ["Status atual: ", (0, u.jsxs)("b", { className: "text-white", children: [e.length, " baralho(s)"] }), " · ", (0, u.jsxs)("b", { className: "text-white", children: [t.length, " ficha(s)"] })] }),
          w > 0 ? (0, u.jsxs)("span", { className: "text-violet-light", children: ["🎙 ", w, " áudio(s)"] }) : null
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-2.5",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "📤" }), " Exportar Backup"] }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Gera um arquivo .leaki com baralhos, fichas e histórico. Envie pelo WhatsApp, Drive ou cabo e importe no outro aparelho." })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "flex gap-2 flex-wrap pt-1",
            children: [
              (0, u.jsx)("button", {
                type: "button",
                onClick: S,
                className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white hover:bg-violet-light transition-all shadow-[0_4px_16px_rgba(110,86,207,0.3)] flex items-center gap-1.5",
                children: [(0, u.jsx)("span", { children: "📤" }), " Enviar arquivo (.leaki)"]
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: _,
                className: "font-body text-xs font-medium rounded-full px-3.5 py-2 bg-base-raised text-ink-soft hover:text-ink hover:bg-base-strong transition-colors flex items-center gap-1.5",
                children: [(0, u.jsx)("span", { children: a ? "✓" : "📋" }), a ? "Copiado!" : "Copiar JSON"]
              })
            ]
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-2.5",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "📥" }), " Importar ou Restaurar"] }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Carregue um arquivo JSON exportado previamente para restaurar baralhos e relatórios." })
            ]
          }),
          (0, u.jsx)("input", {
            ref: x,
            type: "file",
            accept: ".leaki,.json,application/json",
            onChange: N,
            className: "hidden"
          }),
          !f ? (0, u.jsxs)("div", {
            className: "space-y-3 pt-1",
            children: [
              (0, u.jsxs)("div", {
                className: "flex gap-2 flex-wrap",
                children: [
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => x.current?.click(),
                    className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised border border-base-strong text-white hover:bg-base-strong transition-colors flex items-center gap-1.5",
                    children: [(0, u.jsx)("span", { children: "📁" }), " Escolher arquivo (.leaki)"]
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => o(e => !e),
                    className: "font-body text-xs font-medium rounded-full px-3.5 py-2 text-ink-soft hover:text-ink transition-colors",
                    children: i ? "Ocultar texto" : "ou colar texto JSON"
                  })
                ]
              }),
              i ? (0, u.jsxs)("div", {
                className: "space-y-2 pt-1",
                children: [
                  (0, u.jsx)("textarea", {
                    value: s,
                    onChange: e => d(e.target.value),
                    rows: 4,
                    placeholder: "Cole o conteúdo JSON do backup aqui...",
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors resize-none"
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: C,
                    disabled: !s.trim(),
                    className: "font-body text-xs font-medium rounded-full px-4 py-1.5 bg-violet text-white hover:bg-violet-light disabled:opacity-40 transition-colors",
                    children: "Carregar dados colados"
                  })
                ]
              }) : null
            ]
          }) : (0, u.jsxs)("div", {
            className: "p-3.5 rounded-xl bg-violet/10 border border-violet/40 space-y-3 animate-in fade-in-0 duration-200",
            children: [
              (0, u.jsxs)("div", {
                className: "space-y-1",
                children: [
                  (0, u.jsx)("p", { className: "font-display font-medium text-xs text-violet-light", children: "✨ Conteúdo do backup identificado:" }),
                  (0, u.jsxs)("ul", {
                    className: "font-mono text-xs text-ink-soft space-y-0.5 pl-1",
                    children: [
                      (0, u.jsxs)("li", { children: ["• ", (0, u.jsxs)("b", { className: "text-white", children: [f.decks.length, " baralho(s)"] })] }),
                      (0, u.jsxs)("li", { children: ["• ", (0, u.jsxs)("b", { className: "text-white", children: [f.cards.length, " ficha(s)"] })] }),
                      f.history && f.history.length > 0 ? (0, u.jsxs)("li", { children: ["• ", (0, u.jsxs)("b", { className: "text-white", children: [f.history.length, " registro(s) de relatório"] })] }) : null,
                      f.exportedAt ? (0, u.jsxs)("li", { className: "text-[11px] text-ink-soft/70", children: ["Exportado em: ", new Date(f.exportedAt).toLocaleString("pt-BR")] }) : null
                    ]
                  })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "space-y-1.5 pt-1",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Modo de Importação:" }),
                  (0, u.jsxs)("div", {
                    className: "grid grid-cols-2 gap-2",
                    children: [
                      (0, u.jsxs)("button", {
                        type: "button",
                        onClick: () => m("merge"),
                        className: "p-2.5 rounded-xl border text-left transition-colors " + ("merge" === h ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                        children: [
                          (0, u.jsx)("p", { className: "font-medium text-xs", children: "Mesclar dados" }),
                          (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Mantém atuais e adiciona novos" })
                        ]
                      }),
                      (0, u.jsxs)("button", {
                        type: "button",
                        onClick: () => m("replace"),
                        className: "p-2.5 rounded-xl border text-left transition-colors " + ("replace" === h ? "border-coral bg-coral-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                        children: [
                          (0, u.jsx)("p", { className: "font-medium text-xs", children: "Substituir tudo" }),
                          (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Apaga atuais e usa o backup" })
                        ]
                      })
                    ]
                  })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "flex items-center gap-2 pt-2",
                children: [
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: z,
                    className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-teal text-white hover:bg-teal/90 transition-colors shadow-[0_4px_16px_rgba(48,164,108,0.3)]",
                    children: "Confirmar Importação"
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => { p(null); d(""); },
                    className: "font-body text-xs font-medium rounded-full px-3.5 py-2 text-ink-soft hover:text-ink transition-colors",
                    children: "Cancelar seleção"
                  })
                ]
              })
            ]
          })
        ]
      }),
      g ? (0, u.jsx)("div", { className: "p-3 rounded-xl bg-teal-dim border border-teal/40 text-teal font-mono text-xs", children: g }) : null,
      v ? (0, u.jsx)("div", { className: "p-3 rounded-xl bg-coral-dim border border-coral/40 text-coral font-mono text-xs", children: v }) : null,
      (0, u.jsx)("div", {
        className: "flex justify-end pt-1",
        children: (0, u.jsx)("button", {
          type: "button",
          onClick: r,
          className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised text-ink-soft hover:text-ink hover:bg-base-strong transition-colors",
          children: "Fechar"
        })
      })
    ]
  });
}

