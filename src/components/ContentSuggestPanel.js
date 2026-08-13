function eContentSuggest({ history, cards, decks, aiCfg, onSaveAI, onApproveCards }) {
  let [interests, setInterests] = (0, c.useState)(aiCfg?.learnerInterests || "");
  let [difficulties, setDifficulties] = (0, c.useState)(aiCfg?.learnerDifficulties || "");
  let [inbox, setInbox] = (0, c.useState)(() => pruneContentInbox(aiCfg?.contentInbox || []));
  let [busy, setBusy] = (0, c.useState)(!1);
  let [msg, setMsg] = (0, c.useState)(null);
  let [err, setErr] = (0, c.useState)(null);
  let evidence = (0, c.useMemo)(
    () => buildLearnerEvidence(history, cards, decks, { interests, difficulties }),
    [history, cards, decks, interests, difficulties]
  );
  let pending = inbox.filter(item => item.status === "pending");
  let backend = pickContentSuggestBackend(aiCfg);

  function persistInbox(next) {
    let pruned = pruneContentInbox(next);
    setInbox(pruned);
    if (onSaveAI) onSaveAI({ contentInbox: pruned });
  }

  function handleSaveProfile() {
    if (onSaveAI) {
      onSaveAI({
        learnerInterests: interests.trim(),
        learnerDifficulties: difficulties.trim()
      });
    }
    setMsg("Perfil do aluno salvo.");
    setErr(null);
    setTimeout(() => setMsg(null), 2500);
  }

  async function handleAskAI() {
    if (busy) return;
    setBusy(!0);
    setErr(null);
    setMsg(null);
    try {
      if (onSaveAI) {
        await onSaveAI({
          learnerInterests: interests.trim(),
          learnerDifficulties: difficulties.trim()
        });
      }
      let result = await requestContentSuggestions({
        history,
        cards,
        decks,
        aiCfg: Object.assign({}, aiCfg, {
          learnerInterests: interests.trim(),
          learnerDifficulties: difficulties.trim()
        })
      });
      let stamped = result.items.map(item => Object.assign({
        id: typeof ea === "function" ? ea() : "sug-" + Date.now() + "-" + Math.random().toString(16).slice(2),
        status: "pending",
        createdAt: new Date().toISOString(),
        deckId: matchDeckHint(decks, item.deckHint) || (decks && decks.length === 1 ? decks[0].id : "")
      }, item));
      persistInbox(stamped.concat(inbox));
      setMsg(result.items.length + " sugestões prontas. Nada foi inserido nos baralhos.");
    } catch (e) {
      setErr(e && e.message ? e.message : String(e));
    }
    setBusy(!1);
  }

  function updateItem(id, patch) {
    setInbox(inbox.map(item => item.id === id ? Object.assign({}, item, patch) : item));
  }

  function discardItem(id) {
    persistInbox(inbox.map(item => item.id === id ? Object.assign({}, item, { status: "discarded" }) : item));
  }

  function releaseItem(item) {
    if (!item.deckId) {
      setErr("Escolha o baralho antes de liberar.");
      return;
    }
    if (!onApproveCards) return;
    onApproveCards([{
      deckId: item.deckId,
      front: item.front,
      back: item.back,
      readingTime: suggestionReadingTime(item.kind)
    }]);
    persistInbox(inbox.map(cur => cur.id === item.id ? Object.assign({}, cur, { status: "inserted" }) : cur));
    setErr(null);
    setMsg("Ficha liberada no baralho.");
    setTimeout(() => setMsg(null), 2500);
  }

  let kindLabel = { word: "Palavra", phrase: "Frase", text: "Texto" };

  return (0, u.jsxs)("div", {
    className: "space-y-4",
    children: [
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white", children: "Perfil do aluno" }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "A IA só usa o que você escrever aqui e os logs reais de estudo. Ela não cria ficha sozinha." })
            ]
          }),
          (0, u.jsxs)("label", {
            className: "block space-y-1",
            children: [
              (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Interesses" }),
              (0, u.jsx)("textarea", {
                value: interests,
                onChange: ev => setInterests(ev.target.value),
                rows: 2,
                placeholder: "ex.: dinossauros, futebol, gatos, aniversário da irmã",
                className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs outline-none focus:border-violet transition-colors resize-none text-white"
              })
            ]
          }),
          (0, u.jsxs)("label", {
            className: "block space-y-1",
            children: [
              (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Dificuldades já conhecidas" }),
              (0, u.jsx)("textarea", {
                value: difficulties,
                onChange: ev => setDifficulties(ev.target.value),
                rows: 3,
                placeholder: "ex.: troca B/P, lê sem as vogais do meio, cansa em frase longa, confunde CASA e CADA",
                className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs outline-none focus:border-violet transition-colors resize-none text-white"
              })
            ]
          }),
          (0, u.jsx)("button", {
            type: "button",
            onClick: handleSaveProfile,
            className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised text-white hover:bg-base-strong transition-colors",
            children: "Salvar perfil"
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-violet-dim border border-violet/40 space-y-2",
        children: [
          (0, u.jsx)("p", { className: "font-display font-medium text-white", children: "O que os logs mostram" }),
          (0, u.jsxs)("p", { className: "text-sm text-ink-soft", children: [evidence.sessions, " sessões na semana · voz ", evidence.voiceAvg === null ? "sem dados" : evidence.voiceAvg + "%"] }),
          evidence.hardWords.length
            ? (0, u.jsxs)("p", { className: "text-sm text-white", children: ["Travou em: ", evidence.hardWords.map(w => w.word).join(", ")] })
            : (0, u.jsx)("p", { className: "text-sm text-ink-soft", children: "Ainda não há palavras marcadas como difíceis nesta semana." }),
          evidence.confusions.length
            ? (0, u.jsx)("p", { className: "text-xs text-ink-soft", children: "Trocas recentes: " + evidence.confusions.slice(0, 5).map(x => x.expected + " → " + x.spoken + " (" + x.accuracy + "%)").join(" · ") })
            : null
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white", children: "Lista da IA" }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: backend ? "A IA monta palavras, frases e textos curtos. Você escolhe o baralho e libera uma a uma." : "Configure Gemini ou OpenAI na aba IA para pedir a lista." })
            ]
          }),
          (0, u.jsx)("button", {
            type: "button",
            disabled: busy || !backend,
            onClick: handleAskAI,
            className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white hover:bg-violet-light disabled:opacity-40 transition-colors",
            children: busy ? "Analisando logs…" : "Pedir sugestões à IA"
          }),
          pending.length === 0 ? (0, u.jsx)("p", { className: "text-xs text-ink-soft font-mono py-2", children: "Nenhuma sugestão esperando liberação." }) : pending.map(item => (0, u.jsxs)("div", {
            className: "p-3 rounded-xl bg-base-raised/70 border border-base-line space-y-2",
            children: [
              (0, u.jsxs)("div", {
                className: "flex items-center justify-between gap-2",
                children: [
                  (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase text-violet-light", children: kindLabel[item.kind] || item.kind }),
                  item.basedOn && item.basedOn.length ? (0, u.jsx)("span", { className: "text-[10px] text-ink-soft truncate", children: "com base em " + item.basedOn.join(", ") }) : null
                ]
              }),
              (0, u.jsx)("input", {
                value: item.front,
                onChange: ev => updateItem(item.id, { front: ev.target.value }),
                className: "w-full bg-base-surface border border-base-line rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet"
              }),
              (0, u.jsx)("textarea", {
                value: item.back,
                onChange: ev => updateItem(item.id, { back: ev.target.value }),
                rows: item.kind === "text" ? 3 : 2,
                placeholder: "Verso (apoio do adulto)",
                className: "w-full bg-base-surface border border-base-line rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet resize-none"
              }),
              item.reason ? (0, u.jsx)("p", { className: "text-[11px] text-ink-soft", children: item.reason }) : null,
              (0, u.jsxs)("div", {
                className: "flex flex-wrap gap-2 items-center pt-1",
                children: [
                  (0, u.jsxs)("select", {
                    value: item.deckId || "",
                    onChange: ev => updateItem(item.id, { deckId: ev.target.value }),
                    className: "flex-1 min-w-[8rem] bg-base-surface border border-base-line rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet",
                    children: [
                      (0, u.jsx)("option", { value: "", children: "Escolher baralho…" }),
                      (decks || []).map(deck => (0, u.jsx)("option", { value: deck.id, children: deck.name }, deck.id))
                    ]
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => releaseItem(item),
                    className: "font-body text-xs font-medium rounded-full px-3.5 py-2 bg-teal text-white",
                    children: "Liberar"
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => discardItem(item.id),
                    className: "font-body text-xs rounded-full px-3 py-2 text-ink-soft",
                    children: "Descartar"
                  })
                ]
              })
            ]
          }, item.id))
        ]
      }),
      msg ? (0, u.jsx)("div", { className: "p-3 rounded-xl bg-teal-dim border border-teal/40 text-teal font-mono text-xs", children: msg }) : null,
      err ? (0, u.jsx)("div", { className: "p-3 rounded-xl bg-coral-dim border border-coral/40 text-coral font-mono text-xs", children: err }) : null
    ]
  });
}

function matchDeckHint(decks, hint) {
  let needle = normalizeStr(hint || "");
  if (!needle || !decks || !decks.length) return "";
  let hit = decks.find(deck => normalizeStr(deck.name || "") === needle)
    || decks.find(deck => normalizeStr(deck.name || "").indexOf(needle) >= 0);
  return hit ? hit.id : "";
}
