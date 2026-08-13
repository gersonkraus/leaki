function el({ decks: e, cards: t, isParentMode: isParent, onToggleParentMode: toggleParent, onOpenDeck: n, onEditDeck: r, onDeleteDeck: a, onNewDeck: l, onOpenBackup: i, onOpenStats: o }) {
  return (0, u.jsxs)("div", {
    className: "max-w-3xl mx-auto px-4 kid-shell flex flex-col",
    children: [
      (0, u.jsxs)("header", {
        className: "relative mb-8 pb-5 border-b border-base-line flex items-center justify-between gap-4 flex-wrap",
        children: [
          (0, u.jsx)("div", { className: "ambient-glow absolute -top-16 -left-10 w-72 h-40 pointer-events-none" }),
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("p", { className: "font-mono text-[11px] tracking-[0.2em] text-ink-soft uppercase mb-1", children: "LEAKI · ALFABETIZAÇÃO" }),
              (0, u.jsx)("h1", { className: "font-display font-semibold text-2xl sm:text-3xl leading-none text-white", children: "Escolha o que estudar" })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "flex items-center gap-2 flex-wrap",
            children: [
              isParent ? (0, u.jsxs)(u.Fragment, {
                children: [
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: l,
                    className: "tap-min font-body text-sm font-semibold rounded-full bg-violet px-4 text-white hover:bg-violet-light transition-colors",
                    children: "+ Novo baralho"
                  }),
                  (0, u.jsxs)("details", {
                    className: "more-menu",
                    children: [
                      (0, u.jsx)("summary", {
                        className: "tap-min inline-flex items-center justify-center rounded-full bg-base-raised border border-base-line px-4 font-body text-sm font-medium text-white",
                        children: "Mais"
                      }),
                      (0, u.jsxs)("div", {
                        className: "more-menu-panel",
                        children: [
                          (0, u.jsxs)("button", {
                            type: "button",
                            onClick: ev => { let d = ev.currentTarget.closest("details"); if (d) d.removeAttribute("open"); o(); },
                            children: [(0, u.jsx)("span", { children: "📊" }), " Relatório & IA"]
                          }),
                          (0, u.jsxs)("button", {
                            type: "button",
                            onClick: ev => { let d = ev.currentTarget.closest("details"); if (d) d.removeAttribute("open"); i(); },
                            children: [(0, u.jsx)("span", { children: "💾" }), " Backup"]
                          }),
                          (0, u.jsxs)("button", {
                            type: "button",
                            onClick: ev => { let d = ev.currentTarget.closest("details"); if (d) d.removeAttribute("open"); toggleParent(); },
                            children: [(0, u.jsx)("span", { children: "🔒" }), " Sair da gestão"]
                          })
                        ]
                      })
                    ]
                  })
                ]
              }) : (0, u.jsxs)("button", {
                type: "button",
                onClick: toggleParent,
                className: "tap-min font-body text-sm font-medium rounded-full bg-base-raised border border-base-line px-4 text-white hover:border-base-strong transition-all flex items-center gap-1.5",
                title: "Área de Administração e Configurações dos Pais",
                children: [
                  (0, u.jsx)("span", { children: "⚙️" }),
                  " Área dos Pais"
                ]
              })
            ]
          })
        ]
      }),
      0 === e.length ? (0, u.jsxs)("div", {
        className: "border border-dashed border-base-strong rounded-3xl py-20 text-center bg-base-surface/40 flex-1 flex flex-col items-center justify-center",
        children: [
          (0, u.jsx)("div", { className: "text-4xl mb-3", children: "📚" }),
          (0, u.jsx)("p", { className: "font-display font-medium text-xl mb-2 text-white", children: isParent ? "Crie o primeiro baralho" : "Ainda não há palavras para ler" }),
          (0, u.jsx)("p", { className: "text-sm text-ink-soft max-w-sm mb-6", children: isParent ? "Monte um baralho de leitura ou restaure um backup." : "Peça a um responsável para criar o primeiro baralho." }),
          isParent ? (0, u.jsxs)("div", {
            className: "flex flex-col sm:flex-row items-center gap-3",
            children: [
              (0, u.jsx)("button", {
                type: "button",
                onClick: l,
                className: "tap-min font-body text-sm font-semibold rounded-full bg-violet px-5 text-white hover:bg-violet-light transition-colors",
                children: "+ Novo baralho"
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: i,
                className: "tap-min font-body text-sm font-medium rounded-full bg-base-raised border border-base-line px-5 text-white",
                children: "Restaurar backup"
              })
            ]
          }) : (0, u.jsxs)("button", {
            type: "button",
            onClick: toggleParent,
            className: "tap-min font-body text-sm font-medium rounded-full bg-violet px-5 text-white hover:bg-violet-light transition-colors flex items-center gap-2",
            children: [
              (0, u.jsx)("span", { children: "⚙️" }),
              " Área dos Pais"
            ]
          })
        ]
      }) : (0, u.jsx)("ul", {
        className: "deck-grid flex-1",
        children: e.map(e => {
          let l = t.filter(t => t.deckId === e.id),
            dueCount = l.filter(X).length;
          return (0, u.jsxs)("li", {
            className: "deck-tile ficha-card",
            children: [
              (0, u.jsxs)("button", {
                type: "button",
                className: "text-left w-full flex-1 flex flex-col justify-between gap-3",
                onClick: () => n(e.id),
                children: [
                  (0, u.jsxs)("div", {
                    className: "flex items-start justify-between gap-3",
                    children: [
                      (0, u.jsxs)("div", {
                        className: "min-w-0 flex-1",
                        children: [
                          (0, u.jsx)("h2", { className: "deck-title", children: e.name }),
                          e.description ? (0, u.jsx)("p", { className: "text-sm text-ink-soft mt-1", children: e.description }) : null
                        ]
                      }),
                      dueCount > 0 ? (0, u.jsxs)("span", {
                        className: "shrink-0 font-body text-xs font-semibold rounded-full status-due px-3 py-2",
                        children: [dueCount, " para ler"]
                      }) : (0, u.jsx)("span", {
                        className: "shrink-0 font-body text-xs rounded-full status-ok px-3 py-2 font-semibold",
                        children: l.length ? "em dia" : "vazio"
                      })
                    ]
                  }),
                  (0, u.jsxs)("div", {
                    className: "pt-3 border-t border-base-line flex items-center justify-between text-ink-soft font-body text-sm",
                    children: [
                      (0, u.jsxs)("span", { children: [l.length, " ", 1 === l.length ? "palavra" : "palavras"] }),
                      (0, u.jsx)("span", { className: "text-white font-semibold", children: "Abrir →" })
                    ]
                  })
                ]
              }),
              isParent ? (0, u.jsxs)("div", {
                className: "mt-3 pt-2 border-t border-base-line/40 flex justify-end gap-2",
                children: [
                  (0, u.jsx)("button", {
                    onClick: () => r(e),
                    className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-base-raised text-ink-soft hover:text-ink transition-colors",
                    children: "editar"
                  }),
                  (0, u.jsx)("button", {
                    onClick: () => a(e.id),
                    className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-coral-dim text-coral hover:bg-coral hover:text-white transition-colors",
                    children: "excluir"
                  })
                ]
              }) : null
            ]
          }, e.id);
        })
      })
    ]
  });
}

let ei = { new: "novo", learning: "aprendendo", mature: "maduro" },
  eo = { new: "text-ink-soft", learning: "text-amber", mature: "text-teal" };

