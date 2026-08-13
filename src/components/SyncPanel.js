function eSyncPanel({ syncCfg, onSaveSync, onSyncNow, busy, learners, activeLearnerId, onSwitchLearner, onAddLearner, onRenameLearner, onRemoveLearner, onOpenLearnerModal }) {
  let cfg = syncCfg || defaultSyncConfig();
  let [keyDraft, setKeyDraft] = (0, c.useState)(cfg.pairKey || "");
  let [urlDraft, setUrlDraft] = (0, c.useState)(cfg.syncUrl || DEFAULT_SYNC_HOST);
  let [copied, setCopied] = (0, c.useState)(!1);
  let valid = isValidPairKey(keyDraft);
  let list = learners || [];

  (0, c.useEffect)(() => {
    setKeyDraft(cfg.pairKey || "");
    setUrlDraft(cfg.syncUrl || DEFAULT_SYNC_HOST);
  }, [cfg.pairKey, cfg.syncUrl, activeLearnerId]);

  function save(partial) {
    if (onSaveSync) onSaveSync(Object.assign({}, cfg, { pairKey: normalizePairKey(keyDraft), syncUrl: urlDraft.trim() || DEFAULT_SYNC_HOST }, partial));
  }

  async function copyKey() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(normalizePairKey(keyDraft));
      setCopied(!0);
      setTimeout(() => setCopied(!1), 2000);
    } catch (e) {}
  }

  return (0, u.jsxs)("div", {
    className: "space-y-4",
    children: [
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white", children: "Crianças neste site" }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Cada criança tem chave e conteúdo próprios. O celular dela usa só a chave dela." })
            ]
          }),
          list.map(item => (0, u.jsxs)("div", {
            className: "flex flex-wrap items-center gap-2 p-2 rounded-xl bg-base-raised/70 border border-base-line",
            children: [
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => onSwitchLearner && onSwitchLearner(item.id),
                className: "learner-chip" + (item.id === activeLearnerId ? " is-active" : ""),
                children: item.id === activeLearnerId ? "ativa" : "abrir"
              }),
              (0, u.jsx)("p", {
                className: "flex-1 min-w-[8rem] font-display font-medium text-sm text-white truncate",
                children: item.name
              }),
              (0, u.jsx)("span", {
                className: "font-mono text-[10px] text-ink-soft truncate max-w-[10rem]",
                children: item.pairKey || "sem chave"
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => onOpenLearnerModal && onOpenLearnerModal({ mode: "edit", learner: item }),
                className: "tap-min font-body text-xs font-medium rounded-full px-3 py-1.5 bg-base-surface text-white",
                children: "Editar"
              })
            ]
          }, item.id)),
          (0, u.jsx)("button", {
            type: "button",
            onClick: () => onOpenLearnerModal ? onOpenLearnerModal({ mode: "add" }) : (onAddLearner && onAddLearner(nextLearnerName(list))),
            className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised text-white",
            children: "Nova criança"
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white", children: "Parear celular desta criança" }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Cole esta chave só no celular dela. Outra criança = outra chave. O site troca dados com https://leaki.gerson.com." })
            ]
          }),
          (0, u.jsxs)("label", {
            className: "block space-y-1",
            children: [
              (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "URL do sync" }),
              (0, u.jsx)("input", {
                value: urlDraft,
                onChange: ev => setUrlDraft(ev.target.value),
                onBlur: () => save({}),
                placeholder: DEFAULT_SYNC_HOST,
                className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-violet"
              })
            ]
          }),
          (0, u.jsxs)("label", {
            className: "block space-y-1",
            children: [
              (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Chave de pareamento" }),
              (0, u.jsx)("input", {
                value: keyDraft,
                onChange: ev => setKeyDraft(ev.target.value),
                placeholder: "leaki_…",
                spellCheck: !1,
                className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-violet"
              })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "flex flex-wrap gap-2",
            children: [
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => {
                  let next = generatePairKey();
                  setKeyDraft(next);
                  save({ pairKey: next, enabled: !0 });
                },
                className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white",
                children: "Gerar chave"
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: copyKey,
                disabled: !valid,
                className: "font-body text-xs rounded-full px-4 py-2 bg-base-raised text-white disabled:opacity-40",
                children: copied ? "Copiada" : "Copiar"
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: () => save({ enabled: !cfg.enabled, pairKey: normalizePairKey(keyDraft), syncUrl: urlDraft.trim() || DEFAULT_SYNC_HOST }),
                disabled: !valid,
                className: "font-body text-xs rounded-full px-4 py-2 border " + (cfg.enabled ? "border-teal text-teal" : "border-base-line text-ink-soft") + " disabled:opacity-40",
                children: cfg.enabled ? "Sync ligado" : "Ligar sync"
              })
            ]
          }),
          !valid && keyDraft ? (0, u.jsx)("p", { className: "text-[11px] text-coral", children: "A chave precisa ser leaki_ e 32 hex. Use Gerar chave ou cole a do outro aparelho." }) : null
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-violet-dim border border-violet/40 space-y-2",
        children: [
          (0, u.jsx)("p", { className: "font-display font-medium text-white", children: "Estado" }),
          (0, u.jsx)("p", { className: "text-sm text-ink-soft", children: cfg.enabled ? "Sincronizando em segundo plano. Falha de rede não interrompe o estudo." : "Sync desligado neste aparelho." }),
          cfg.lastAt ? (0, u.jsxs)("p", { className: "text-xs text-white", children: ["Último envio: ", new Date(cfg.lastAt).toLocaleString("pt-BR")] }) : null,
          cfg.lastStatus ? (0, u.jsxs)("p", { className: "text-xs text-ink-soft", children: ["Motivo: ", cfg.lastStatus, " · rev ", cfg.rev || 0] }) : null,
          cfg.lastError ? (0, u.jsx)("p", { className: "text-xs text-coral", children: cfg.lastError }) : null,
          (0, u.jsx)("button", {
            type: "button",
            disabled: busy || !cfg.enabled || !valid,
            onClick: onSyncNow,
            className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-teal text-white disabled:opacity-40",
            children: busy ? "Sincronizando…" : "Sincronizar agora"
          })
        ]
      })
    ]
  });
}
