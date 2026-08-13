const modalCloseStack = [];

function ef({ title: e, onClose: t, children: n, wide, nested, focusClose }) {
  let closeRef = (0, c.useRef)(null);
  (0, c.useEffect)(() => {
    let prev = document.activeElement;
    if (focusClose !== !1 && closeRef.current) closeRef.current.focus();
    modalCloseStack.push(t);
    function onKey(ev) {
      if (ev.key !== "Escape") return;
      if (modalCloseStack[modalCloseStack.length - 1] !== t) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      t();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      let idx = modalCloseStack.lastIndexOf(t);
      if (idx >= 0) modalCloseStack.splice(idx, 1);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return (0, u.jsx)("div", {
    className: (wide ? "admin-overlay" : "sheet-overlay") + (nested ? " is-nested" : ""),
    role: "presentation",
    onMouseDown: ev => { if (ev.target === ev.currentTarget) t(); },
    children: (0, u.jsxs)("div", {
      className: wide ? "admin-dialog" : "sheet-dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": e,
      children: [
        (0, u.jsxs)("div", {
          className: wide ? "admin-head" : "sheet-head",
          children: [
            (0, u.jsx)("h2", { className: "font-display font-semibold text-base text-white", children: e }),
            (0, u.jsx)("button", {
              ref: closeRef,
              type: "button",
              onClick: t,
              "aria-label": "Fechar painel",
              className: "font-mono text-xs px-2.5 py-1 rounded-full bg-base-raised text-ink-soft hover:text-ink transition-colors shrink-0",
              children: "fechar ✕"
            })
          ]
        }),
        wide
          ? n
          : (0, u.jsx)("div", { className: "sheet-body", children: n })
      ]
    })
  });
}
