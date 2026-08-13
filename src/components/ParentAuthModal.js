function ec(e, fallbackText) {
  stopTTSPlayback();
  if (e) {
    new Audio(e).play().catch(() => {
      if (fallbackText) speakWordTTS(fallbackText);
    });
  } else if (fallbackText) {
    speakWordTTS(fallbackText);
  }
}

const PIN_LOCK_KEY = "leaki-parent-pin-lock";
const PIN_LOCK_MAX = 5;
const PIN_LOCK_MS = 30000;

function readPinLock() {
  try {
    let raw = localStorage.getItem(PIN_LOCK_KEY);
    if (!raw) return { fails: 0, until: 0 };
    let parsed = JSON.parse(raw);
    let until = Number(parsed.until) || 0;
    let fails = Number(parsed.fails) || 0;
    if (until && Date.now() >= until) return { fails: 0, until: 0 };
    return { fails, until };
  } catch (e) {
    return { fails: 0, until: 0 };
  }
}

function writePinLock(fails, until) {
  try {
    localStorage.setItem(PIN_LOCK_KEY, JSON.stringify({ fails, until: until || 0 }));
  } catch (e) {}
}

function clearPinLock() {
  try { localStorage.removeItem(PIN_LOCK_KEY); } catch (e) {}
}

function ParentAuthModal({ lock, onSaveLock, onSuccess, onClose }) {
  let needsSetup = !hasParentPin(lock);
  let initialLock = readPinLock();
  let [mode, setMode] = (0, c.useState)(needsSetup ? "setup" : "unlock");
  let [pin, setPin] = (0, c.useState)("");
  let [pin2, setPin2] = (0, c.useState)("");
  let [error, setError] = (0, c.useState)("");
  let [busy, setBusy] = (0, c.useState)(!1);
  let [fails, setFails] = (0, c.useState)(initialLock.fails);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    if (!/^\d{4}$/.test(pin)) {
      setError("Use um PIN de 4 números.");
      return;
    }
    setBusy(!0);
    setError("");
    try {
      if (mode === "setup") {
        if (pin !== pin2) {
          setError("Os dois PINs não são iguais.");
          setBusy(!1);
          return;
        }
        let next = await createParentPin(pin, lock || {});
        if (onSaveLock) await onSaveLock(persistableAISettings(next));
        clearPinLock();
        setFails(0);
        onSuccess(next);
        return;
      }
      let lockState = readPinLock();
      if (lockState.until && Date.now() < lockState.until) {
        setError("Muitas tentativas. Espere um pouco e tente de novo.");
        setBusy(!1);
        return;
      }
      if (lockState.until && Date.now() >= lockState.until) {
        clearPinLock();
        setFails(0);
        lockState = { fails: 0, until: 0 };
      }
      let unlocked = await unlockParentSettings(pin, lock);
      if (!unlocked) {
        let nextFails = (lockState.fails || fails) + 1;
        let until = nextFails >= PIN_LOCK_MAX ? Date.now() + PIN_LOCK_MS : 0;
        setFails(nextFails);
        writePinLock(nextFails, until);
        setError(until ? "Muitas tentativas. Espere um pouco e tente de novo." : "PIN incorreto.");
        setPin("");
        setBusy(!1);
        return;
      }
      clearPinLock();
      setFails(0);
      onSuccess(unlocked);
    } catch (err) {
      setError(mode === "setup"
        ? "Não foi possível criar o PIN neste aparelho."
        : "Não foi possível validar o PIN neste aparelho.");
    }
    setBusy(!1);
  }

  function handleForgot() {
    if (!confirm("Isso apaga o PIN e a chave do Gemini salva. Os baralhos da criança ficam. Continuar?")) return;
    let next = resetParentPin(lock);
    if (onSaveLock) onSaveLock(next);
    clearPinLock();
    setFails(0);
    setMode("setup");
    setPin("");
    setPin2("");
    setError("PIN apagado. Crie um novo.");
  }

  return (0, u.jsx)(ef, {
    title: mode === "setup" ? "Criar PIN dos pais" : "Área dos pais",
    onClose: onClose,
    children: (0, u.jsxs)("form", {
      onSubmit: handleSubmit,
      className: "space-y-4 text-center py-2",
      children: [
        (0, u.jsx)("p", {
          className: "text-sm text-ink-soft",
          children: mode === "setup"
            ? "Escolha um PIN de 4 números. A criança precisa dele para abrir a gestão. Guarde em um lugar seguro."
            : "Digite o PIN de 4 números para abrir as configurações."
        }),
        (0, u.jsx)("input", {
          type: "password",
          inputMode: "numeric",
          autoComplete: "one-time-code",
          maxLength: 4,
          autoFocus: !0,
          value: pin,
          onChange: ev => { setPin(ev.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); },
          placeholder: "••••",
          className: "w-32 text-center bg-base-surface border border-base-line focus:border-violet text-white font-mono text-xl tracking-widest rounded-xl px-3 py-3 outline-none"
        }),
        mode === "setup" ? (0, u.jsx)("input", {
          type: "password",
          inputMode: "numeric",
          maxLength: 4,
          value: pin2,
          onChange: ev => { setPin2(ev.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); },
          placeholder: "Repita o PIN",
          className: "w-32 text-center bg-base-surface border border-base-line focus:border-violet text-white font-mono text-xl tracking-widest rounded-xl px-3 py-3 outline-none"
        }) : null,
        error ? (0, u.jsx)("p", { className: "text-xs font-body text-coral", children: error }) : null,
        (0, u.jsxs)("div", {
          className: "flex justify-center gap-2 pt-2 flex-wrap",
          children: [
            (0, u.jsx)("button", {
              type: "button",
              onClick: onClose,
              className: "font-body text-xs font-medium rounded-full px-4 py-2 text-ink-soft",
              children: "Cancelar"
            }),
            (0, u.jsx)("button", {
              type: "submit",
              disabled: busy,
              className: "font-body text-xs font-medium rounded-full px-5 py-2 bg-violet text-white disabled:opacity-50",
              children: mode === "setup" ? "Criar PIN" : "Entrar"
            })
          ]
        }),
        mode === "unlock" ? (0, u.jsx)("button", {
          type: "button",
          onClick: handleForgot,
          className: "font-body text-xs text-ink-soft",
          children: "Esqueci o PIN"
        }) : null
      ]
    })
  });
}
