function ec(e, fallbackText) {
  if (e) {
    new Audio(e).play().catch(() => {
      if (fallbackText) speakWordTTS(fallbackText);
    });
  } else if (fallbackText) {
    speakWordTTS(fallbackText);
  }
}

function ParentAuthModal({ onSuccess, onClose }) {
  let [n1] = (0, c.useState)(() => Math.floor(Math.random() * 5) + 3);
  let [n2] = (0, c.useState)(() => Math.floor(Math.random() * 4) + 2);
  let [answer, setAnswer] = (0, c.useState)("");
  let [error, setError] = (0, c.useState)(!1);

  function handleSubmit(e) {
    e.preventDefault();
    if (parseInt(answer, 10) === (n1 + n2)) {
      onSuccess();
    } else {
      setError(!0);
      setAnswer("");
    }
  }

  return (0, u.jsx)(ef, {
    title: "Acesso dos Pais / Gestão",
    onClose: onClose,
    children: (0, u.jsxs)("form", {
      onSubmit: handleSubmit,
      className: "space-y-4 text-center py-2",
      children: [
        (0, u.jsx)("p", {
          className: "text-xs text-ink-soft",
          children: "Confirme que você é um adulto para acessar configurações e gerenciamento de baralhos:"
        }),
        (0, u.jsxs)("div", {
          className: "p-4 rounded-xl bg-base-raised border border-base-line inline-block",
          children: [
            (0, u.jsxs)("p", {
              className: "font-mono text-base font-semibold text-white tracking-widest",
              children: ["Quanto é ", n1, " + ", n2, " ?"]
            }),
            (0, u.jsx)("input", {
              type: "number",
              autoFocus: !0,
              value: answer,
              onChange: e => { setAnswer(e.target.value); setError(!1); },
              placeholder: "Resposta",
              className: "mt-3 w-28 text-center bg-base-surface border border-base-line focus:border-violet text-white font-mono text-sm rounded-xl px-3 py-2 outline-none transition-colors"
            })
          ]
        }),
        error ? (0, u.jsx)("p", { className: "text-xs font-mono text-coral", children: "Resposta incorreta. Tente novamente." }) : null,
        (0, u.jsxs)("div", {
          className: "flex justify-center gap-2 pt-2",
          children: [
            (0, u.jsx)("button", {
              type: "button",
              onClick: onClose,
              className: "font-body text-xs font-medium rounded-full px-4 py-2 text-ink-soft hover:text-ink hover:bg-base-raised transition-colors",
              children: "Cancelar"
            }),
            (0, u.jsx)("button", {
              type: "submit",
              className: "font-body text-xs font-medium rounded-full px-5 py-2 bg-violet text-white hover:bg-violet-light transition-colors shadow-[0_4px_16px_rgba(110,86,207,0.3)]",
              children: "Entrar"
            })
          ]
        })
      ]
    })
  });
}

