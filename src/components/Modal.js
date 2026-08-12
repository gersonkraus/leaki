function ef({ title: e, onClose: t, children: n }) {
  return (0, u.jsx)("div", {
    className: "fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4",
    onMouseDown: e => { e.target === e.currentTarget && t(); },
    children: (0, u.jsxs)("div", {
      className: "bg-base-surface border border-base-line rounded-3xl w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto",
      children: [
        (0, u.jsxs)("div", {
          className: "flex items-center justify-between border-b border-base-line px-5 py-4 sticky top-0 bg-base-surface z-10",
          children: [
            (0, u.jsx)("h3", { className: "font-display font-semibold text-base text-white", children: e }),
            (0, u.jsx)("button", {
              onClick: t,
              className: "font-mono text-xs px-2.5 py-1 rounded-full bg-base-raised text-ink-soft hover:text-ink transition-colors",
              children: "fechar ✕"
            })
          ]
        }),
        (0, u.jsx)("div", { className: "p-5", children: n })
      ]
    })
  });
}

