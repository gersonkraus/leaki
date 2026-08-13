function em({ initial: e, onSave: t, onCancel: n }) {
  let [r, a] = (0, c.useState)(e?.front ?? ""),
    [l, i] = (0, c.useState)(e?.back ?? ""),
    [o, s] = (0, c.useState)(e?.frontAudio),
    [d, f] = (0, c.useState)(e?.backAudio),
    [timeSec, setTimeSec] = (0, c.useState)(e?.readingTime ? Number(e.readingTime) : 7),
    [saving, setSaving] = (0, c.useState)(!1);
  let mountedRef = (0, c.useRef)(!0);
  (0, c.useEffect)(() => () => { mountedRef.current = !1; }, []);

  return (0, u.jsxs)("form", {
    className: "space-y-4",
    onSubmit: async ev => {
      ev.preventDefault();
      let frontText = r.trim();
      let backText = l.trim() || "";
      let limit = Number(timeSec) || 7;
      if (!frontText || saving) return;
      let frontAud = o;
      if (!frontAud && isEdgeTTSVoice(getTTSVoiceName()) && isOnline()) {
        setSaving(!0);
        try { frontAud = await synthesizeToDataUrl(frontText) || o; } catch (err) { frontAud = o; }
        if (mountedRef.current) setSaving(!1);
      }
      if (!mountedRef.current) return;
      t(frontText, backText, frontAud, d, limit);
    },
    children: [
      (0, u.jsxs)("div", {
        children: [
          (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Frente (Palavra / Frase)" }),
          (0, u.jsx)("textarea", {
            autoFocus: !0,
            value: r,
            disabled: saving,
            onChange: e => a(e.target.value),
            rows: 2,
            placeholder: "ex.: BOLA ou O cachorro late",
            className: "mt-1.5 w-full bg-base-raised border border-base-line rounded-xl px-3 py-2.5 outline-none focus:border-violet transition-colors resize-none text-white text-sm disabled:opacity-50"
          }),
          (0, u.jsx)(eh, { label: "frente", value: o, onChange: s })
        ]
      }),
      (0, u.jsxs)("div", {
        children: [
          (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Verso (Significado / Resposta)" }),
          (0, u.jsx)("textarea", {
            value: l,
            onChange: e => i(e.target.value),
            rows: 2,
            placeholder: "ex.: ⚽ Bola de futebol ou O animal faz som",
            className: "mt-1.5 w-full bg-base-raised border border-base-line rounded-xl px-3 py-2.5 outline-none focus:border-violet transition-colors resize-none text-white text-sm"
          }),
          (0, u.jsx)(eh, { label: "verso", value: d, onChange: f })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-3.5 rounded-xl bg-base-raised/70 border border-base-line space-y-2",
        children: [
          (0, u.jsxs)("div", {
            className: "flex items-center justify-between",
            children: [
              (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "⏱️ Tempo limite de leitura da frente" }),
              (0, u.jsxs)("span", { className: "font-mono text-xs text-violet-light font-semibold", children: [timeSec, " segundos"] })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "flex items-center gap-2 flex-wrap",
            children: [
              (0, u.jsx)("input", {
                type: "number",
                min: 2,
                max: 120,
                value: timeSec,
                onChange: e => setTimeSec(Math.max(2, Math.min(120, Number(e.target.value) || 7))),
                className: "w-20 bg-base-surface border border-base-line rounded-xl px-3 py-1.5 text-xs font-mono outline-none focus:border-violet transition-colors text-white"
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => setTimeSec(5),
                className: "font-mono text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors " + (5 === timeSec ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                children: "5s (palavra curta)"
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => setTimeSec(8),
                className: "font-mono text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors " + (8 === timeSec ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                children: "8s (palavra longa)"
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => setTimeSec(15),
                className: "font-mono text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors " + (15 === timeSec ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                children: "15s (frase curta)"
              })
            ]
          }),
          (0, u.jsx)("p", {
            className: "text-[10px] text-ink-soft/80 font-mono",
            children: "Se a criança demorar mais que esse tempo para virar a ficha ou tocar em áudio, o app registra hesitação."
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "flex justify-end gap-2 pt-2",
        children: [
          (0, u.jsx)("button", {
            type: "button",
            onClick: n,
            disabled: saving,
            className: "font-body text-xs font-medium rounded-full px-4 py-2 text-ink-soft hover:text-ink hover:bg-base-raised transition-colors disabled:opacity-40",
            children: "cancelar"
          }),
          (0, u.jsx)("button", {
            type: "submit",
            className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white hover:bg-violet-light transition-colors",
            disabled: saving,
            children: saving ? "gerando áudio…" : "salvar"
          })
        ]
      })
    ]
  });
}
