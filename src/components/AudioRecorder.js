function eh({ label: e, value: t, onChange: n }) {
  let [r, a] = (0, c.useState)(!1),
    [l, i] = (0, c.useState)(null),
    o = (0, c.useRef)(null),
    s = (0, c.useRef)([]);

  async function d() {
    i(null);
    try {
      let e = await navigator.mediaDevices.getUserMedia({ audio: !0 }),
        t = new MediaRecorder(e);
      s.current = [];
      t.ondataavailable = e => { e.data.size > 0 && s.current.push(e.data); };
      t.onstop = () => {
        e.getTracks().forEach(e => e.stop());
        let r = new Blob(s.current, { type: t.mimeType || "audio/webm" }),
          a = new FileReader();
        a.onloadend = () => n(a.result);
        a.readAsDataURL(r);
      };
      t.start();
      o.current = t;
      a(!0);
    } catch {
      i("Não foi possível acessar o microfone.");
    }
  }

  return (0, u.jsxs)("div", {
    className: "mt-2 flex flex-wrap items-center gap-2",
    children: [
      r ? (0, u.jsx)("button", {
        type: "button",
        onClick: function() { o.current?.stop(); a(!1); },
        className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-full bg-coral text-white animate-pulse",
        children: "⏹ parar gravação"
      }) : (0, u.jsxs)("button", {
        type: "button",
        onClick: d,
        className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-full bg-base-raised text-ink-soft hover:text-ink transition-colors",
        children: ["🎙 gravar áudio (", e, ")"]
      }),
      t ? (0, u.jsxs)(u.Fragment, {
        children: [
          (0, u.jsx)("audio", { controls: !0, src: t, className: "h-8 max-w-[170px]" }),
          (0, u.jsx)("button", {
            type: "button",
            onClick: () => n(void 0),
            className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-full bg-coral-dim text-coral hover:bg-coral hover:text-white transition-colors",
            children: "remover"
          })
        ]
      }) : null,
      l ? (0, u.jsx)("span", { className: "font-mono text-[10px] text-coral", children: l }) : null
    ]
  });
}

