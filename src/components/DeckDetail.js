function es({ deck: e, cards: t, isParentMode: isParent, onBack: n, onStudy: r, onNewCard: a, onEditCard: l, onDeleteCard: i }) {
  let o = t.filter(X).length;
  return (0, u.jsxs)("div", {
    className: "max-w-3xl mx-auto px-4 kid-shell flex flex-col",
    children: [
      (0, u.jsx)("button", {
        onClick: n,
        className: "font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-ink mb-6 transition-colors self-start flex items-center gap-1.5",
        children: "← Voltar aos baralhos"
      }),
      (0, u.jsxs)("header", {
        className: "mb-6 pb-6 border-b border-base-line flex items-end justify-between gap-4 flex-wrap",
        children: [
          (0, u.jsxs)("div", {
            className: "min-w-0 flex-1",
            children: [
              (0, u.jsx)("p", { className: "font-mono text-[11px] tracking-[0.2em] text-ink-soft uppercase mb-1", children: "BARALHO SELECIONADO" }),
              (0, u.jsx)("h1", { className: "font-display font-semibold text-2xl sm:text-3xl text-white truncate", children: e.name }),
              e.description ? (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-1", children: e.description }) : null
            ]
          }),
          (0, u.jsxs)("button", {
            onClick: r,
            disabled: 0 === o,
            className: "study-action shrink-0 font-body text-base font-semibold rounded-full bg-violet px-6 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2",
            children: [
              (0, u.jsx)("span", { children: "📖" }),
              " Começar Leitura (", o, ")"
            ]
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "flex items-center justify-between mb-4",
        children: [
          (0, u.jsxs)("p", { className: "font-mono text-[11px] uppercase tracking-wide text-ink-soft", children: [t.length, " fichas cadastradas"] }),
          isParent ? (0, u.jsx)("button", {
            onClick: a,
            className: "font-body text-xs font-medium rounded-full bg-base-raised px-4 py-2 hover:bg-base-strong text-white transition-colors flex items-center gap-1.5",
            children: [(0, u.jsx)("span", { children: "➕" }), " Nova ficha"]
          }) : null
        ]
      }),
      0 === t.length ? (0, u.jsxs)("div", {
        className: "border border-dashed border-base-strong rounded-2xl py-14 text-center bg-base-surface/40 flex-1 flex flex-col items-center justify-center",
        children: [
          (0, u.jsx)("p", { className: "font-display font-medium text-lg mb-2 text-white", children: "Nenhuma ficha ainda" }),
          (0, u.jsx)("p", { className: "text-sm text-ink-soft mb-4", children: "Adicione palavras ou frases a este baralho para começar." }),
          isParent ? (0, u.jsx)("button", {
            onClick: a,
            className: "font-body text-xs font-medium rounded-full bg-violet px-4 py-2 text-white hover:bg-violet-light transition-colors",
            children: "+ Adicionar primeira ficha"
          }) : null
        ]
      }) : (0, u.jsx)("ul", {
        className: "ficha-list",
        children: t.map(e => {
          let t = Z(e);
          return (0, u.jsxs)("li", {
            className: "ficha-card",
            children: [
              (0, u.jsxs)("div", {
                className: "flex items-start justify-between gap-3",
                children: [
                  (0, u.jsx)("p", { className: "ficha-word min-w-0 flex-1", children: e.front }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: ev => { ev.preventDefault(); ev.stopPropagation(); ec(e.frontAudio, e.front); },
                    className: "speak-btn shrink-0",
                    title: "Ouvir a palavra",
                    "aria-label": "Ouvir " + e.front,
                    children: "🔊"
                  })
                ]
              }),
              e.back ? (0, u.jsxs)("div", {
                className: "flex items-center justify-between gap-3",
                children: [
                  (0, u.jsx)("p", { className: "font-body text-base text-ink-soft min-w-0 flex-1", children: e.back }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: ev => { ev.preventDefault(); ev.stopPropagation(); ec(e.backAudio, e.back); },
                    className: "speak-btn shrink-0",
                    title: "Ouvir o significado",
                    "aria-label": "Ouvir significado",
                    children: "🔊"
                  })
                ]
              }) : null,
              (0, u.jsxs)("div", {
                className: "flex items-center justify-between gap-2 flex-wrap pt-1",
                children: [
                  X(e) ? (0, u.jsx)("span", { className: "font-body text-xs font-semibold rounded-full bg-coral-dim text-coral px-3 py-1", children: "para hoje" }) : (0, u.jsx)("span", { className: "font-body text-xs text-teal", children: "em dia" }),
                  isParent ? (0, u.jsxs)("div", {
                    className: "flex gap-2",
                    children: [
                      (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase " + eo[t], children: ei[t] }),
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => l(e),
                        className: "font-body text-xs px-3 py-2 rounded-full bg-base-raised text-ink-soft",
                        children: "editar"
                      }),
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => i(e.id),
                        className: "font-body text-xs px-3 py-2 rounded-full bg-coral-dim text-coral",
                        children: "excluir"
                      })
                    ]
                  }) : null
                ]
              })
            ]
          }, e.id);
        })
      })
    ]
  });
}

