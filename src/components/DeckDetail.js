function es({ deck: e, cards: t, isParentMode: isParent, onBack: n, onStudy: r, onNewCard: a, onEditCard: l, onDeleteCard: i }) {
  let o = t.filter(X).length;
  return (0, u.jsxs)("div", {
    className: "max-w-3xl mx-auto px-4 sm:px-6 py-8 min-h-screen flex flex-col",
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
            className: "shrink-0 font-body text-base font-semibold rounded-full bg-violet px-6 py-3.5 text-white hover:bg-violet-light shadow-[0_8px_24px_rgba(110,86,207,0.35)] transition-all disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2",
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
        className: "rounded-2xl border border-base-line bg-base-surface/70 divide-y divide-base-line overflow-hidden",
        children: t.map(e => {
          let t = Z(e);
          return (0, u.jsxs)("li", {
            className: "group px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-base-raised/60 transition-colors",
            children: [
              (0, u.jsxs)("div", {
                className: "min-w-0 flex-1",
                children: [
                  (0, u.jsxs)("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      (0, u.jsx)("span", { className: "font-medium text-white text-base", children: e.front }),
                      (0, u.jsx)("button", {
                        onClick: () => e.frontAudio ? new Audio(e.frontAudio).play().catch(() => {}) : speakWordTTS(e.front),
                        className: "shrink-0 text-ink-soft hover:text-violet-light transition-colors text-sm",
                        title: e.frontAudio ? "Ouvir gravação" : "Ouvir pronúncia automática (TTS)",
                        children: "🔊"
                      }),
                      (0, u.jsxs)("span", { className: "text-ink-soft text-sm", children: [" — ", e.back] }),
                      (0, u.jsx)("button", {
                        onClick: () => e.backAudio ? new Audio(e.backAudio).play().catch(() => {}) : speakWordTTS(e.back),
                        className: "shrink-0 text-ink-soft hover:text-violet-light transition-colors text-sm",
                        title: e.backAudio ? "Ouvir gravação" : "Ouvir pronúncia automática (TTS)",
                        children: "🔊"
                      })
                    ]
                  }),
                  (0, u.jsxs)("p", {
                    className: "font-mono text-[10px] uppercase tracking-wide mt-1 flex gap-3 flex-wrap text-ink-soft",
                    children: [
                      (0, u.jsx)("span", { className: eo[t], children: ei[t] }),
                      (0, u.jsxs)("span", { className: "text-ink-soft/70", children: ["intervalo ", J(e.scheduled_days)] }),
                      e.readingTime ? (0, u.jsxs)("span", { className: "text-violet-light font-medium", children: ["⏱️ ", e.readingTime, "s"] }) : null,
                      X(e) ? (0, u.jsx)("span", { className: "text-coral font-medium", children: "• para hoje" }) : null
                    ]
                  })
                ]
              }),
              isParent ? (0, u.jsxs)("div", {
                className: "shrink-0 flex gap-1.5",
                children: [
                  (0, u.jsx)("button", {
                    onClick: () => l(e),
                    className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-base-raised text-ink-soft hover:text-ink transition-colors",
                    children: "editar"
                  }),
                  (0, u.jsx)("button", {
                    onClick: () => i(e.id),
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

