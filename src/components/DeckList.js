function el({ decks: e, cards: t, isParentMode: isParent, onToggleParentMode: toggleParent, onOpenDeck: n, onEditDeck: r, onDeleteDeck: a, onNewDeck: l, onOpenBackup: i, onOpenStats: o }) {
  return (0, u.jsxs)("div", {
    className: "max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-screen flex flex-col",
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
                  (0, u.jsxs)("button", {
                    type: "button",
                    onClick: o,
                    className: "font-body text-xs font-medium rounded-full bg-base-raised border border-base-line px-3 py-1.5 text-ink-soft hover:text-ink hover:border-base-strong transition-all flex items-center gap-1.5",
                    children: [(0, u.jsx)("span", { children: "📊" }), " Relatório & IA"]
                  }),
                  (0, u.jsxs)("button", {
                    type: "button",
                    onClick: i,
                    className: "font-body text-xs font-medium rounded-full bg-base-raised border border-base-line px-3 py-1.5 text-ink-soft hover:text-ink hover:border-base-strong transition-all flex items-center gap-1.5",
                    children: [(0, u.jsx)("span", { children: "💾" }), " Backup"]
                  }),
                  (0, u.jsx)("button", {
                    onClick: l,
                    className: "font-body text-xs font-medium rounded-full bg-violet px-3.5 py-1.5 text-white hover:bg-violet-light transition-colors shadow-[0_4px_16px_rgba(110,86,207,0.3)]",
                    children: "+ Novo baralho"
                  }),
                  (0, u.jsx)("button", {
                    onClick: toggleParent,
                    className: "font-mono text-[11px] uppercase tracking-wide rounded-full bg-violet/20 border border-violet/50 text-violet-light px-3 py-1.5 hover:bg-violet/30 transition-colors",
                    children: "🔒 Sair da Gestão"
                  })
                ]
              }) : (0, u.jsxs)("button", {
                type: "button",
                onClick: toggleParent,
                className: "font-body text-xs font-medium rounded-full bg-base-raised/70 border border-base-line px-3.5 py-1.5 text-ink-soft hover:text-white hover:border-base-strong transition-all flex items-center gap-1.5 shadow-sm",
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
          (0, u.jsx)("p", { className: "font-display font-medium text-xl mb-2 text-white", children: "Nenhum baralho criado ainda" }),
          (0, u.jsx)("p", { className: "text-sm text-ink-soft max-w-sm mb-6", children: "Acesse a Área dos Pais para criar seu primeiro baralho de leitura ou restaurar um backup." }),
          (0, u.jsxs)("button", {
            onClick: toggleParent,
            className: "font-body text-sm font-medium rounded-full bg-violet px-5 py-2.5 text-white hover:bg-violet-light transition-colors shadow-[0_8px_24px_rgba(110,86,207,0.35)] flex items-center gap-2",
            children: [
              (0, u.jsx)("span", { children: "⚙️" }),
              " Entrar na Área dos Pais"
            ]
          })
        ]
      }) : (0, u.jsx)("ul", {
        className: "grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-start",
        children: e.map(e => {
          let l = t.filter(t => t.deckId === e.id),
            dueCount = l.filter(X).length;
          return (0, u.jsxs)("li", {
            className: "group relative bg-base-surface/80 border border-base-line rounded-2xl p-5 hover:border-violet/50 hover:bg-base-surface transition-all flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
            children: [
              (0, u.jsxs)("button", {
                className: "text-left w-full flex-1 flex flex-col justify-between",
                onClick: () => n(e.id),
                children: [
                  (0, u.jsxs)("div", {
                    className: "flex items-start justify-between gap-3 mb-4",
                    children: [
                      (0, u.jsxs)("div", {
                        className: "min-w-0 flex-1",
                        children: [
                          (0, u.jsx)("h2", { className: "font-display font-semibold text-xl text-white group-hover:text-violet-light transition-colors truncate", children: e.name }),
                          e.description ? (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-1 line-clamp-2", children: e.description }) : null
                        ]
                      }),
                      dueCount > 0 ? (0, u.jsxs)("span", {
                        className: "shrink-0 font-mono text-xs font-semibold rounded-full bg-coral-dim text-coral px-3 py-1",
                        children: [dueCount, " para estudar"]
                      }) : (0, u.jsx)("span", {
                        className: "shrink-0 font-mono text-[10px] text-teal rounded-full bg-teal-dim px-2.5 py-1 uppercase tracking-wider font-semibold",
                        children: "✓ em dia"
                      })
                    ]
                  }),
                  (0, u.jsxs)("div", {
                    className: "pt-3 border-t border-base-line/60 flex items-center justify-between text-ink-soft font-mono text-xs",
                    children: [
                      (0, u.jsxs)("span", { children: [l.length, " palavras no baralho"] }),
                      (0, u.jsx)("span", { className: "text-violet-light font-body font-medium", children: "Iniciar estudo ➔" })
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

