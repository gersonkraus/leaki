function ep({ initial: e, onSave: t, onCancel: n }) {
  let [r, a] = (0, c.useState)(e?.name ?? ""),
    [l, i] = (0, c.useState)(e?.description ?? ""),
    [audioHint, setAudioHint] = (0, c.useState)(e?.audioHintEnabled ?? !1),
    [skipRec, setSkipRec] = (0, c.useState)(e?.skipRecordingEnabled ?? !1);
  return (0, u.jsxs)("form", {
    className: "space-y-4",
    onSubmit: e => { e.preventDefault(); r.trim() && t(r.trim(), l.trim(), audioHint, skipRec); },
    children: [
      (0, u.jsxs)("div", {
        children: [
          (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Nome do baralho" }),
          (0, u.jsx)("input", {
            autoFocus: !0,
            value: r,
            onChange: e => a(e.target.value),
            placeholder: "ex.: Palavras com a Letra B",
            className: "mt-1.5 w-full bg-base-raised border border-base-line rounded-xl px-3 py-2.5 outline-none focus:border-violet transition-colors text-white text-sm"
          })
        ]
      }),
      (0, u.jsxs)("div", {
        children: [
          (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Descrição (opcional)" }),
          (0, u.jsx)("textarea", {
            value: l,
            onChange: e => i(e.target.value),
            rows: 2,
            placeholder: "Do que se trata este baralho?",
            className: "mt-1.5 w-full bg-base-raised border border-base-line rounded-xl px-3 py-2.5 outline-none focus:border-violet transition-colors text-white text-sm resize-none"
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "space-y-2.5 pt-1",
        children: [
          (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Opções de estudo" }),
          (0, u.jsxs)("div", {
            className: "p-3 rounded-xl bg-base-raised border border-base-line flex items-center justify-between gap-3",
            children: [
              (0, u.jsxs)("div", {
                children: [
                  (0, u.jsx)("p", { className: "text-sm text-white font-medium", children: "🔊 Dica de Áudio" }),
                  (0, u.jsx)("p", { className: "text-[11px] text-ink-soft mt-0.5", children: "Mostra botão de ouvir a palavra no lado A do cartão." })
                ]
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => setAudioHint(e => !e),
                className: "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 " + (audioHint ? "bg-violet" : "bg-base-strong"),
                children: (0, u.jsx)("span", {
                  className: "inline-block h-4 w-4 transform rounded-full bg-white transition-transform " + (audioHint ? "translate-x-6" : "translate-x-1")
                })
              })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "p-3 rounded-xl bg-base-raised border border-base-line flex items-center justify-between gap-3",
            children: [
              (0, u.jsxs)("div", {
                children: [
                  (0, u.jsx)("p", { className: "text-sm text-white font-medium", children: "👁 Pular gravação" }),
                  (0, u.jsx)("p", { className: "text-[11px] text-ink-soft mt-0.5", children: "Permite ver a resposta sem precisar gravar a leitura em voz alta." })
                ]
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => setSkipRec(e => !e),
                className: "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 " + (skipRec ? "bg-violet" : "bg-base-strong"),
                children: (0, u.jsx)("span", {
                  className: "inline-block h-4 w-4 transform rounded-full bg-white transition-transform " + (skipRec ? "translate-x-6" : "translate-x-1")
                })
              })
            ]
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "flex justify-end gap-2 pt-2",
        children: [
          (0, u.jsx)("button", {
            type: "button",
            onClick: n,
            className: "font-body text-xs font-medium rounded-full px-4 py-2 text-ink-soft hover:text-ink hover:bg-base-raised transition-colors",
            children: "cancelar"
          }),
          (0, u.jsx)("button", {
            type: "submit",
            className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white hover:bg-violet-light transition-colors",
            children: "salvar"
          })
        ]
      })
    ]
  });
}

var c = (o("dtVek"), o("dtVek"), o("dtVek"));

