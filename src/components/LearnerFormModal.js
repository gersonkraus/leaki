function eLearnerFormModal({ mode, learner, name: nameProp, defaultName, canDelete, onClose, onSave, onDelete }) {
  let isEdit = mode === "edit";
  let initialName = String((learner && learner.name) || nameProp || defaultName || "").trim();
  let [name, setName] = (0, c.useState)(initialName);
  let [step, setStep] = (0, c.useState)("form");
  let [error, setError] = (0, c.useState)("");
  let inputRef = (0, c.useRef)(null);
  let title = step === "confirm"
    ? "Apagar criança"
    : (isEdit ? "Editar criança" : "Nova criança");

  (0, c.useEffect)(() => {
    if (step !== "form") return;
    let el = inputRef.current;
    if (!el || typeof el.focus !== "function") return;
    el.focus();
    if (typeof el.select === "function" && isEdit) el.select();
  }, [step]);

  function submit(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    let next = String(name || "").trim();
    if (!next) {
      setError("Escreva o nome da criança.");
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    if (onSave) onSave(next);
  }

  return (0, u.jsx)(ef, {
    title,
    nested: !0,
    focusClose: !1,
    onClose,
    children: step === "confirm" ? (0, u.jsxs)("div", {
      className: "space-y-4",
      children: [
        (0, u.jsxs)("p", {
          className: "text-sm text-ink-soft",
          children: [
            "Os baralhos e o histórico de ",
            (0, u.jsx)("span", { className: "text-white font-medium", children: initialName || "esta criança" }),
            " saem só deste aparelho. Não dá para desfazer."
          ]
        }),
        (0, u.jsxs)("div", {
          className: "flex flex-wrap justify-end gap-2 pt-1",
          children: [
            (0, u.jsx)("button", {
              type: "button",
              onClick: () => setStep("form"),
              className: "tap-min font-body text-sm font-medium rounded-full px-4 py-2 text-ink-soft",
              children: "Voltar"
            }),
            (0, u.jsx)("button", {
              type: "button",
              onClick: () => onDelete && onDelete(),
              className: "tap-min font-body text-sm font-medium rounded-full px-5 py-2 bg-coral text-white",
              children: initialName ? ("Apagar " + initialName) : "Apagar"
            })
          ]
        })
      ]
    }) : (0, u.jsxs)("form", {
      onSubmit: submit,
      className: "space-y-4",
      children: [
        (0, u.jsx)("p", {
          className: "text-sm text-ink-soft",
          children: isEdit
            ? (canDelete ? "Mude o nome ou apague esta criança deste aparelho." : "Mude o nome desta criança.")
            : "Esse nome aparece no painel e no celular dela."
        }),
        (0, u.jsxs)("label", {
          className: "block space-y-1.5",
          children: [
            (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Nome" }),
            (0, u.jsx)("input", {
              ref: inputRef,
              value: name,
              onChange: ev => { setName(ev.target.value); setError(""); },
              placeholder: "Ex.: Ana",
              autoComplete: "nickname",
              autoCapitalize: "words",
              enterKeyHint: "done",
              maxLength: 40,
              className: "learner-name-field",
              "aria-invalid": error ? "true" : "false",
              "aria-describedby": error ? "learner-name-error" : undefined
            })
          ]
        }),
        error ? (0, u.jsx)("p", { id: "learner-name-error", className: "text-xs text-coral", role: "alert", children: error }) : null,
        (0, u.jsxs)("div", {
          className: "flex flex-wrap items-center justify-between gap-2 pt-1",
          children: [
            isEdit && canDelete ? (0, u.jsx)("button", {
              type: "button",
              onClick: () => setStep("confirm"),
              className: "tap-min font-body text-sm font-medium rounded-full px-4 py-2 text-coral",
              children: "Apagar criança"
            }) : (0, u.jsx)("span", {}),
            (0, u.jsxs)("div", {
              className: "flex flex-wrap justify-end gap-2 ml-auto",
              children: [
                (0, u.jsx)("button", {
                  type: "button",
                  onClick: onClose,
                  className: "tap-min font-body text-sm font-medium rounded-full px-4 py-2 text-ink-soft",
                  children: "Cancelar"
                }),
                (0, u.jsx)("button", {
                  type: "submit",
                  className: "tap-min font-body text-sm font-medium rounded-full px-5 py-2 bg-violet text-white",
                  children: isEdit ? "Salvar nome" : "Adicionar"
                })
              ]
            })
          ]
        }),
        isEdit && !canDelete ? (0, u.jsx)("p", {
          className: "text-[11px] text-ink-soft",
          children: "Precisa ficar pelo menos uma criança."
        }) : null
      ]
    })
  });
}
