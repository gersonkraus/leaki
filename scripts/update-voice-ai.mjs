import fs from "fs";
import vm from "vm";

let html = fs.readFileSync("leaki.html", "utf8");

const storageOld = 'let en="anki-crud:decks",er="anki-crud:cards",ehistory="anki-crud:history",eaisettings="anki-crud:ai-settings";';
if (!html.includes(storageOld)) {
  console.log("storageOld already exists or needs checking");
}

const appStartIdx = html.indexOf("function normalizeStr(");
const htmlBeforeApp = html.slice(0, appStartIdx);

const newAppCode = `function normalizeStr(e) {
  return (e || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9\\s]/g, "")
    .trim();
}

function levenshtein(e, t) {
  let n = e ? e.length : 0,
    r = t ? t.length : 0;
  if (0 === n) return r;
  if (0 === r) return n;
  let a = Array.from({ length: r + 1 }, (e, t) => [t]);
  for (let t = 0; t <= n; t++) a[0][t] = t;
  for (let l = 1; l <= r; l++)
    for (let i = 1; i <= n; i++)
      t.charAt(l - 1) === e.charAt(i - 1)
        ? (a[l][i] = a[l - 1][i - 1])
        : (a[l][i] = Math.min(a[l - 1][i - 1] + 1, a[l][i - 1] + 1, a[l - 1][i] + 1));
  return a[r][n];
}

function calculateSpeechAccuracy(e, t) {
  let n = normalizeStr(e),
    r = normalizeStr(t);
  if (!n) return 0;
  if (n === r) return 100;
  let a = n.split(/\\s+/).filter(Boolean),
    l = r.split(/\\s+/).filter(Boolean);
  if (l.length > 1) {
    let e = 0;
    for (let t of l) {
      let n = 0;
      for (let r of a) {
        let a = levenshtein(r, t),
          l = Math.max(r.length, t.length),
          i = Math.max(0, Math.round((1 - a / l) * 100));
        i > n && (n = i);
      }
      e += n;
    }
    return Math.round(e / l.length);
  }
  let i = levenshtein(n, r),
    o = Math.max(n.length, r.length);
  return Math.max(0, Math.round((1 - i / o) * 100));
}

function speakWordTTS(text) {
  if (!text || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    let utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 0.88;
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

async function analyzeWithGemini(audioDataUrl, mimeType, expectedText, apiKey, modelName) {
  let model = (modelName || "gemini-2.0-flash").trim();
  let cleanBase64 = audioDataUrl.includes(",") ? audioDataUrl.split(",")[1] : audioDataUrl;
  let prompt = 'Você é um avaliador pedagógico de leitura infantil em português. A palavra ou frase esperada escrita na tela é: "' + expectedText + '". Analise o áudio da criança e responda APENAS um JSON no formato: {"spokenText": "texto falado", "accuracyScore": número de 0 a 100, "feedback": "comentário pedagógico curto e amigável", "quality": "excelente" ou "quase_la" ou "precisa_praticar"}';
  
  let response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType || "audio/webm", data: cleanBase64 } },
          { text: prompt }
        ]
      }]
    })
  });
  
  if (!response.ok) {
    let errText = await response.text().catch(() => "");
    throw new Error("Erro na API Gemini (" + response.status + "): " + errText);
  }
  
  let data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  let cleanJson = text.replaceAll("\`\`\`json", "").replaceAll("\`\`\`", "").trim();
  let parsed = JSON.parse(cleanJson);
  return {
    spokenText: parsed.spokenText || "",
    accuracy: Number(parsed.accuracyScore) || 0,
    feedback: parsed.feedback || "",
    quality: parsed.quality || (parsed.accuracyScore >= 80 ? "excelente" : parsed.accuracyScore >= 50 ? "quase_la" : "precisa_praticar"),
    isAI: !0
  };
}

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

function eBackup({ decks: e, cards: t, history: histList, aiSettings: aiCfg, onImport: n, onClose: r }) {
  let [a, l] = (0, c.useState)(!1);
  let [i, o] = (0, c.useState)(!1);
  let [s, d] = (0, c.useState)("");
  let [f, p] = (0, c.useState)(null);
  let [h, m] = (0, c.useState)("merge");
  let [g, y] = (0, c.useState)(null);
  let [v, b] = (0, c.useState)(null);
  let x = (0, c.useRef)(null);

  let w = (0, c.useMemo)(() => t.filter(e => e.frontAudio || e.backAudio).length, [t]);

  function k() {
    return JSON.stringify({
      version: 1,
      appName: "Leaki",
      exportedAt: new Date().toISOString(),
      decks: e,
      cards: t,
      history: histList || [],
      aiSettings: aiCfg || {}
    }, null, 2);
  }

  function S() {
    try {
      let e = k();
      let t = new Blob([e], { type: "application/json;charset=utf-8" });
      let n = URL.createObjectURL(t);
      let r = document.createElement("a");
      let a = new Date().toISOString().slice(0, 10);
      r.href = n;
      r.download = "leaki-backup-" + a + ".json";
      document.body.appendChild(r);
      r.click();
      setTimeout(() => {
        document.body.removeChild(r);
        URL.revokeObjectURL(n);
      }, 300);
      y("Arquivo de backup baixado com sucesso!");
      b(null);
    } catch (e) {
      b("Erro ao gerar arquivo: " + e.message);
    }
  }

  async function _() {
    try {
      let e = k();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(e);
      } else {
        let t = document.createElement("textarea");
        t.value = e;
        document.body.appendChild(t);
        t.select();
        document.execCommand("copy");
        document.body.removeChild(t);
      }
      l(!0);
      y("JSON copiado para a área de transferência!");
      b(null);
      setTimeout(() => l(!1), 3000);
    } catch (e) {
      b("Não foi possível copiar: " + e.message);
    }
  }

  function E(e) {
    try {
      let t = JSON.parse(e);
      let n = Array.isArray(t) ? t : (t.decks || []);
      let r = Array.isArray(t.cards) ? t.cards : [];
      let h = Array.isArray(t.history) ? t.history : [];
      let ai = t.aiSettings || {};
      if (!Array.isArray(n)) n = [];
      if (!Array.isArray(r)) r = [];
      if (!Array.isArray(h)) h = [];
      if (0 === n.length && 0 === r.length) {
        throw new Error("O arquivo não contém baralhos nem fichas válidos.");
      }
      return { decks: n, cards: r, history: h, aiSettings: ai, exportedAt: t.exportedAt };
    } catch (e) {
      throw new Error("JSON inválido: " + e.message);
    }
  }

  function N(e) {
    let t = e.target.files && e.target.files[0];
    if (!t) return;
    let n = new FileReader();
    n.onload = e => {
      try {
        let t = E(e.target.result);
        p(t);
        y(null);
        b(null);
      } catch (e) {
        b(e.message);
        p(null);
      }
    };
    n.onerror = () => b("Falha ao ler o arquivo selecionado.");
    n.readAsText(t);
    e.target.value = "";
  }

  function C() {
    if (!s.trim()) return;
    try {
      let e = E(s);
      p(e);
      y(null);
      b(null);
    } catch (e) {
      b(e.message);
      p(null);
    }
  }

  function z() {
    if (!f) return;
    try {
      n(f, h);
      r();
    } catch (e) {
      b("Erro ao importar: " + e.message);
    }
  }

  return (0, u.jsxs)("div", {
    className: "space-y-4 text-sm",
    children: [
      (0, u.jsxs)("div", {
        className: "flex items-center justify-between p-3 rounded-xl bg-base-raised/70 border border-base-line font-mono text-[11px] text-ink-soft",
        children: [
          (0, u.jsxs)("span", { children: ["Status atual: ", (0, u.jsxs)("b", { className: "text-white", children: [e.length, " baralho(s)"] }), " · ", (0, u.jsxs)("b", { className: "text-white", children: [t.length, " ficha(s)"] })] }),
          w > 0 ? (0, u.jsxs)("span", { className: "text-violet-light", children: ["🎙 ", w, " áudio(s)"] }) : null
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-2.5",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "📤" }), " Exportar Backup"] }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Gera um arquivo JSON contendo todos os baralhos, fichas, gravações de áudio, histórico e configurações." })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "flex gap-2 flex-wrap pt-1",
            children: [
              (0, u.jsx)("button", {
                type: "button",
                onClick: S,
                className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white hover:bg-violet-light transition-all shadow-[0_4px_16px_rgba(110,86,207,0.3)] flex items-center gap-1.5",
                children: [(0, u.jsx)("span", { children: "📥" }), " Baixar arquivo (.json)"]
              }),
              (0, u.jsx)("button", {
                type: "button",
                onClick: _,
                className: "font-body text-xs font-medium rounded-full px-3.5 py-2 bg-base-raised text-ink-soft hover:text-ink hover:bg-base-strong transition-colors flex items-center gap-1.5",
                children: [(0, u.jsx)("span", { children: a ? "✓" : "📋" }), a ? "Copiado!" : "Copiar JSON"]
              })
            ]
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-2.5",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "📥" }), " Importar ou Restaurar"] }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Carregue um arquivo JSON exportado previamente para restaurar baralhos e relatórios." })
            ]
          }),
          (0, u.jsx)("input", {
            ref: x,
            type: "file",
            accept: ".json,application/json",
            onChange: N,
            className: "hidden"
          }),
          !f ? (0, u.jsxs)("div", {
            className: "space-y-3 pt-1",
            children: [
              (0, u.jsxs)("div", {
                className: "flex gap-2 flex-wrap",
                children: [
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => x.current?.click(),
                    className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised border border-base-strong text-white hover:bg-base-strong transition-colors flex items-center gap-1.5",
                    children: [(0, u.jsx)("span", { children: "📁" }), " Escolher arquivo (.json)"]
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => o(e => !e),
                    className: "font-body text-xs font-medium rounded-full px-3.5 py-2 text-ink-soft hover:text-ink transition-colors",
                    children: i ? "Ocultar texto" : "ou colar texto JSON"
                  })
                ]
              }),
              i ? (0, u.jsxs)("div", {
                className: "space-y-2 pt-1",
                children: [
                  (0, u.jsx)("textarea", {
                    value: s,
                    onChange: e => d(e.target.value),
                    rows: 4,
                    placeholder: "Cole o conteúdo JSON do backup aqui...",
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors resize-none"
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: C,
                    disabled: !s.trim(),
                    className: "font-body text-xs font-medium rounded-full px-4 py-1.5 bg-violet text-white hover:bg-violet-light disabled:opacity-40 transition-colors",
                    children: "Carregar dados colados"
                  })
                ]
              }) : null
            ]
          }) : (0, u.jsxs)("div", {
            className: "p-3.5 rounded-xl bg-violet/10 border border-violet/40 space-y-3 animate-in fade-in-0 duration-200",
            children: [
              (0, u.jsxs)("div", {
                className: "space-y-1",
                children: [
                  (0, u.jsx)("p", { className: "font-display font-medium text-xs text-violet-light", children: "✨ Conteúdo do backup identificado:" }),
                  (0, u.jsxs)("ul", {
                    className: "font-mono text-xs text-ink-soft space-y-0.5 pl-1",
                    children: [
                      (0, u.jsxs)("li", { children: ["• ", (0, u.jsxs)("b", { className: "text-white", children: [f.decks.length, " baralho(s)"] })] }),
                      (0, u.jsxs)("li", { children: ["• ", (0, u.jsxs)("b", { className: "text-white", children: [f.cards.length, " ficha(s)"] })] }),
                      f.history && f.history.length > 0 ? (0, u.jsxs)("li", { children: ["• ", (0, u.jsxs)("b", { className: "text-white", children: [f.history.length, " registro(s) de relatório"] })] }) : null,
                      f.exportedAt ? (0, u.jsxs)("li", { className: "text-[11px] text-ink-soft/70", children: ["Exportado em: ", new Date(f.exportedAt).toLocaleString("pt-BR")] }) : null
                    ]
                  })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "space-y-1.5 pt-1",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Modo de Importação:" }),
                  (0, u.jsxs)("div", {
                    className: "grid grid-cols-2 gap-2",
                    children: [
                      (0, u.jsxs)("button", {
                        type: "button",
                        onClick: () => m("merge"),
                        className: "p-2.5 rounded-xl border text-left transition-colors " + ("merge" === h ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                        children: [
                          (0, u.jsx)("p", { className: "font-medium text-xs", children: "Mesclar dados" }),
                          (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Mantém atuais e adiciona novos" })
                        ]
                      }),
                      (0, u.jsxs)("button", {
                        type: "button",
                        onClick: () => m("replace"),
                        className: "p-2.5 rounded-xl border text-left transition-colors " + ("replace" === h ? "border-coral bg-coral-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                        children: [
                          (0, u.jsx)("p", { className: "font-medium text-xs", children: "Substituir tudo" }),
                          (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Apaga atuais e usa o backup" })
                        ]
                      })
                    ]
                  })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "flex items-center gap-2 pt-2",
                children: [
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: z,
                    className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-teal text-white hover:bg-teal/90 transition-colors shadow-[0_4px_16px_rgba(48,164,108,0.3)]",
                    children: "Confirmar Importação"
                  }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => { p(null); d(""); },
                    className: "font-body text-xs font-medium rounded-full px-3.5 py-2 text-ink-soft hover:text-ink transition-colors",
                    children: "Cancelar seleção"
                  })
                ]
              })
            ]
          })
        ]
      }),
      g ? (0, u.jsx)("div", { className: "p-3 rounded-xl bg-teal-dim border border-teal/40 text-teal font-mono text-xs", children: g }) : null,
      v ? (0, u.jsx)("div", { className: "p-3 rounded-xl bg-coral-dim border border-coral/40 text-coral font-mono text-xs", children: v }) : null,
      (0, u.jsx)("div", {
        className: "flex justify-end pt-1",
        children: (0, u.jsx)("button", {
          type: "button",
          onClick: r,
          className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised text-ink-soft hover:text-ink hover:bg-base-strong transition-colors",
          children: "Fechar"
        })
      })
    ]
  });
}

function eParentStats({ history: e, aiSettings: aiCfg, onSaveAISettings: onSaveAI, onClearHistory: t, onClose: n }) {
  let [activeTab, setActiveTab] = (0, c.useState)("stats"),
    [geminiKey, setGeminiKey] = (0, c.useState)(aiCfg?.geminiKey || ""),
    [geminiModel, setGeminiModel] = (0, c.useState)(aiCfg?.geminiModel || "gemini-2.0-flash"),
    [provider, setProvider] = (0, c.useState)(aiCfg?.provider || "native"),
    [savedMsg, setSavedMsg] = (0, c.useState)(null),
    r = e.reduce((e, t) => e + (t.durationSeconds || 0), 0),
    a = e.reduce((e, t) => e + (t.totalReviews || 0), 0),
    l = e.reduce((e, t) => e + (t.correctCount || 0), 0),
    i = a > 0 ? Math.round((l / a) * 100) : 0;

  function o(e) {
    if (!e || e < 60) return (e || 0) + "s";
    let t = Math.floor(e / 60),
      n = e % 60;
    return t + "m " + (n < 10 ? "0" : "") + n + "s";
  }

  function handleSaveAIConfig(ev) {
    ev.preventDefault();
    let newCfg = { provider, geminiKey: geminiKey.trim(), geminiModel: geminiModel.trim() || "gemini-2.0-flash" };
    if (onSaveAI) onSaveAI(newCfg);
    setSavedMsg("Configurações salvas com sucesso!");
    setTimeout(() => setSavedMsg(null), 3000);
  }

  return (0, u.jsxs)("div", {
    className: "space-y-4 text-sm",
    children: [
      (0, u.jsxs)("div", {
        className: "flex border-b border-base-line gap-4 text-xs font-mono mb-2",
        children: [
          (0, u.jsxs)("button", {
            type: "button",
            onClick: () => setActiveTab("stats"),
            className: "pb-2 border-b-2 font-medium transition-colors " + ("stats" === activeTab ? "border-violet text-white" : "border-transparent text-ink-soft hover:text-ink"),
            children: ["📊 Histórico & Estatísticas"]
          }),
          (0, u.jsxs)("button", {
            type: "button",
            onClick: () => setActiveTab("ai"),
            className: "pb-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 " + ("ai" === activeTab ? "border-violet text-white" : "border-transparent text-ink-soft hover:text-ink"),
            children: [
              (0, u.jsx)("span", { children: "🤖" }),
              " IA & Reconhecimento de Voz"
            ]
          })
        ]
      }),
      "stats" === activeTab ? (0, u.jsxs)("div", {
        className: "space-y-4",
        children: [
          (0, u.jsxs)("div", {
            className: "grid grid-cols-3 gap-2.5",
            children: [
              (0, u.jsxs)("div", {
                className: "p-3 rounded-xl bg-base-raised border border-base-line text-center",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Tempo Total" }),
                  (0, u.jsx)("p", { className: "font-display font-semibold text-lg text-white mt-0.5", children: o(r) })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "p-3 rounded-xl bg-base-raised border border-base-line text-center",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Precisão Geral" }),
                  (0, u.jsxs)("p", { className: "font-display font-semibold text-lg text-teal mt-0.5", children: [i, "%"] })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "p-3 rounded-xl bg-base-raised border border-base-line text-center",
                children: [
                  (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Sessões" }),
                  (0, u.jsx)("p", { className: "font-display font-semibold text-lg text-violet-light mt-0.5", children: e.length })
                ]
              })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3",
            children: [
              (0, u.jsxs)("div", {
                className: "flex items-center justify-between",
                children: [
                  (0, u.jsx)("h4", { className: "font-display font-medium text-white flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "📋" }), " Histórico de Estudos"] }),
                  e.length > 0 ? (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => { if (confirm("Deseja zerar todo o histórico de estudos?")) t(); },
                    className: "font-mono text-[10px] text-ink-soft hover:text-coral transition-colors",
                    children: "limpar histórico"
                  }) : null
                ]
              }),
              0 === e.length ? (0, u.jsx)("p", {
                className: "text-xs text-ink-soft py-4 text-center font-mono",
                children: "Nenhuma sessão realizada ainda. As estatísticas aparecerão aqui após cada estudo."
              }) : (0, u.jsx)("div", {
                className: "space-y-2 max-h-64 overflow-y-auto pr-1",
                children: e.slice().reverse().map((e, t) => {
                  let a = e.avgTimePerCard && e.avgTimePerCard < 3,
                    hesCount = e.struggledCards ? e.struggledCards.length : 0,
                    voiceCount = e.voiceAttempts ? e.voiceAttempts.length : 0;
                  return (0, u.jsxs)("div", {
                    className: "p-3 rounded-lg bg-base-raised/60 border border-base-line space-y-2 text-xs",
                    children: [
                      (0, u.jsxs)("div", {
                        className: "flex items-center justify-between gap-3",
                        children: [
                          (0, u.jsxs)("div", {
                            className: "min-w-0",
                            children: [
                              (0, u.jsx)("p", { className: "font-medium text-white truncate text-sm", children: e.deckName || "Baralho" }),
                              (0, u.jsxs)("p", {
                                className: "font-mono text-[10px] text-ink-soft mt-0.5",
                                children: [
                                  new Date(e.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
                                  " · ",
                                  o(e.durationSeconds),
                                  a ? (0, u.jsx)("span", { className: "text-amber ml-1.5", title: "Ritmo rápido", children: "⚠️ Rápido (" + e.avgTimePerCard + "s/card)" }) : (0, u.jsx)("span", { className: "text-ink-soft/60 ml-1.5", children: "(" + (e.avgTimePerCard || "-") + "s/card)" })
                                ]
                              })
                            ]
                          }),
                          (0, u.jsxs)("div", {
                            className: "text-right shrink-0",
                            children: [
                              (0, u.jsxs)("span", {
                                className: "font-mono font-semibold text-sm " + (e.accuracy >= 70 ? "text-teal" : "text-amber"),
                                children: [e.accuracy, "%"]
                              }),
                              (0, u.jsxs)("p", {
                                className: "font-mono text-[10px] text-ink-soft",
                                children: [e.correctCount || 0, " acertos / ", e.totalReviews || 0]
                              })
                            ]
                          })
                        ]
                      }),
                      voiceCount > 0 ? (0, u.jsxs)("div", {
                        className: "p-2 rounded-lg bg-base-surface border border-violet/30 font-mono text-[11px] text-ink-soft space-y-1",
                        children: [
                          (0, u.jsx)("p", { className: "text-violet-light font-medium text-[10px] uppercase", children: "🎙️ Avaliações de Leitura de Voz:" }),
                          (0, u.jsx)("ul", {
                            className: "space-y-0.5 pl-1",
                            children: e.voiceAttempts.map((va, vaIdx) => (0, u.jsxs)("li", {
                              className: "flex items-center justify-between gap-2 border-b border-base-line/30 pb-0.5",
                              children: [
                                (0, u.jsxs)("span", { children: ["• ", (0, u.jsx)("b", { className: "text-white", children: va.word }), ' ➔ "', va.spoken, '"'] }),
                                (0, u.jsxs)("span", { className: "font-semibold " + (va.accuracy >= 80 ? "text-teal" : va.accuracy >= 50 ? "text-amber" : "text-coral"), children: [va.accuracy, "%"] })
                              ]
                            }, vaIdx))
                          })
                        ]
                      }) : null,
                      hesCount > 0 ? (0, u.jsxs)("div", {
                        className: "p-2 rounded-lg bg-base-surface border border-base-line/60 font-mono text-[11px] text-ink-soft space-y-1",
                        children: [
                          (0, u.jsx)("p", { className: "text-amber font-medium text-[10px] uppercase", children: "🔍 Palavras com dúvida/áudio/hesitação:" }),
                          (0, u.jsx)("ul", {
                            className: "space-y-0.5 pl-1",
                            children: e.struggledCards.map((sc, scIdx) => (0, u.jsxs)("li", {
                              className: "text-ink-soft/90 truncate",
                              children: ["• ", (0, u.jsx)("b", { className: "text-white", children: sc.word }), " — ", sc.reason]
                            }, scIdx))
                          })
                        ]
                      }) : null
                    ]
                  }, t);
                })
              })
            ]
          })
        ]
      }) : (0, u.jsxs)("form", {
        onSubmit: handleSaveAIConfig,
        className: "p-4 rounded-xl bg-base-surface border border-base-line space-y-3.5",
        children: [
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("h4", { className: "font-display font-medium text-white", children: "Motor de Análise de Voz & Leitura" }),
              (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-0.5", children: "Escolha como o aplicativo deve analisar a pronúncia e a leitura em voz alta do seu filho." })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "grid grid-cols-2 gap-2",
            children: [
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setProvider("native"),
                className: "p-3 rounded-xl border text-left transition-colors " + ("native" === provider ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                children: [
                  (0, u.jsx)("p", { className: "font-medium text-xs flex items-center gap-1", children: [(0, u.jsx)("span", { children: "⚡" }), " Nativo (Grátis)"] }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Reconhecimento de voz embutido no celular/PC com análise fonética instantânea." })
                ]
              }),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => setProvider("gemini"),
                className: "p-3 rounded-xl border text-left transition-colors " + ("gemini" === provider ? "border-violet bg-violet-dim text-white" : "border-base-line bg-base-raised text-ink-soft hover:text-ink"),
                children: [
                  (0, u.jsx)("p", { className: "font-medium text-xs flex items-center gap-1", children: [(0, u.jsx)("span", { children: "✨" }), " Google Gemini LLM"] }),
                  (0, u.jsx)("p", { className: "text-[10px] opacity-70 mt-0.5", children: "Avaliação pedagógica inteligente por IA com modelos Gemini mais recentes." })
                ]
              })
            ]
          }),
          "gemini" === provider ? (0, u.jsxs)("div", {
            className: "space-y-3 pt-1",
            children: [
              (0, u.jsxs)("div", {
                className: "space-y-1",
                children: [
                  (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Chave de API do Google AI Studio (Gemini)" }),
                  (0, u.jsx)("input", {
                    type: "password",
                    value: geminiKey,
                    onChange: e => setGeminiKey(e.target.value),
                    placeholder: "AIzaSy...",
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors text-white"
                  })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "space-y-1.5",
                children: [
                  (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "Modelo Gemini (ID do modelo)" }),
                  (0, u.jsx)("input", {
                    type: "text",
                    value: geminiModel,
                    onChange: e => setGeminiModel(e.target.value),
                    placeholder: "gemini-2.0-flash",
                    className: "w-full bg-base-raised border border-base-line rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-violet transition-colors text-white"
                  }),
                  (0, u.jsxs)("div", {
                    className: "flex gap-1.5 flex-wrap pt-1",
                    children: [
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => setGeminiModel("gemini-2.0-flash"),
                        className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors " + ("gemini-2.0-flash" === geminiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                        children: "gemini-2.0-flash (Recomendado)"
                      }),
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => setGeminiModel("gemini-2.5-flash"),
                        className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors " + ("gemini-2.5-flash" === geminiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                        children: "gemini-2.5-flash"
                      }),
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: () => setGeminiModel("gemini-1.5-flash"),
                        className: "font-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors " + ("gemini-1.5-flash" === geminiModel ? "border-violet bg-violet/20 text-white" : "border-base-line text-ink-soft hover:text-ink"),
                        children: "gemini-1.5-flash"
                      })
                    ]
                  })
                ]
              })
            ]
          }) : null,
          savedMsg ? (0, u.jsx)("div", { className: "p-2 rounded-lg bg-teal-dim text-teal font-mono text-xs", children: savedMsg }) : null,
          (0, u.jsx)("div", {
            className: "flex justify-end pt-2",
            children: (0, u.jsx)("button", {
              type: "submit",
              className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-violet text-white hover:bg-violet-light transition-colors shadow-[0_4px_16px_rgba(110,86,207,0.3)]",
              children: "Salvar Configurações de IA"
            })
          })
        ]
      }),
      (0, u.jsx)("div", {
        className: "flex justify-end pt-1",
        children: (0, u.jsx)("button", {
          type: "button",
          onClick: n,
          className: "font-body text-xs font-medium rounded-full px-4 py-2 bg-base-raised text-ink-soft hover:text-ink hover:bg-base-strong transition-colors",
          children: "Fechar"
        })
      })
    ]
  });
}

function el({ decks: e, cards: t, isParentMode: isParent, onToggleParentMode: toggleParent, onOpenDeck: n, onEditDeck: r, onDeleteDeck: a, onNewDeck: l, onOpenBackup: i, onOpenStats: o }) {
  return (0, u.jsxs)("div", {
    className: "max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-screen flex flex-col",
    children: [
      (0, u.jsxs)("header", {
        className: "relative mb-8 pb-5 border-b border-base-line flex items-center justify-between gap-4 flex-wrap",
        children: [
          (0, u.jsx)("div", { className: "ambient-glow absolute -top-16 -left-10 w-72 h-40 pointer-events-none" }),
          (0, u.jsxs)("div", {
            children: [
              (0, u.jsx)("p", { className: "font-mono text-[11px] tracking-[0.2em] text-ink-soft uppercase mb-1", children: "LEAKI · ALFABETIZAÇÃO" }),
              (0, u.jsx)("h1", { className: "font-display font-semibold text-2xl sm:text-3xl leading-none text-white", children: "Escolha o que estudar" })
            ]
          }),
          (0, u.jsxs)("div", {
            className: "flex items-center gap-2 flex-wrap",
            children: [
              isParent ? (0, u.jsxs)(u.Fragment, {
                children: [
                  (0, u.jsxs)("button", {
                    type: "button",
                    onClick: o,
                    className: "font-body text-xs font-medium rounded-full bg-base-raised border border-base-line px-3 py-1.5 text-ink-soft hover:text-ink hover:border-base-strong transition-all flex items-center gap-1.5",
                    children: [(0, u.jsx)("span", { children: "📊" }), " Relatório & IA"]
                  }),
                  (0, u.jsxs)("button", {
                    type: "button",
                    onClick: i,
                    className: "font-body text-xs font-medium rounded-full bg-base-raised border border-base-line px-3 py-1.5 text-ink-soft hover:text-ink hover:border-base-strong transition-all flex items-center gap-1.5",
                    children: [(0, u.jsx)("span", { children: "💾" }), " Backup"]
                  }),
                  (0, u.jsx)("button", {
                    onClick: l,
                    className: "font-body text-xs font-medium rounded-full bg-violet px-3.5 py-1.5 text-white hover:bg-violet-light transition-colors shadow-[0_4px_16px_rgba(110,86,207,0.3)]",
                    children: "+ Novo baralho"
                  }),
                  (0, u.jsx)("button", {
                    onClick: toggleParent,
                    className: "font-mono text-[11px] uppercase tracking-wide rounded-full bg-violet/20 border border-violet/50 text-violet-light px-3 py-1.5 hover:bg-violet/30 transition-colors",
                    children: "🔒 Sair da Gestão"
                  })
                ]
              }) : (0, u.jsxs)("button", {
                type: "button",
                onClick: toggleParent,
                className: "font-body text-xs font-medium rounded-full bg-base-raised/70 border border-base-line px-3.5 py-1.5 text-ink-soft hover:text-white hover:border-base-strong transition-all flex items-center gap-1.5 shadow-sm",
                title: "Área de Administração e Configurações dos Pais",
                children: [
                  (0, u.jsx)("span", { children: "⚙️" }),
                  " Área dos Pais"
                ]
              })
            ]
          })
        ]
      }),
      0 === e.length ? (0, u.jsxs)("div", {
        className: "border border-dashed border-base-strong rounded-3xl py-20 text-center bg-base-surface/40 flex-1 flex flex-col items-center justify-center",
        children: [
          (0, u.jsx)("div", { className: "text-4xl mb-3", children: "📚" }),
          (0, u.jsx)("p", { className: "font-display font-medium text-xl mb-2 text-white", children: "Nenhum baralho criado ainda" }),
          (0, u.jsx)("p", { className: "text-sm text-ink-soft max-w-sm mb-6", children: "Acesse a Área dos Pais para criar seu primeiro baralho de leitura ou restaurar um backup." }),
          (0, u.jsxs)("button", {
            onClick: toggleParent,
            className: "font-body text-sm font-medium rounded-full bg-violet px-5 py-2.5 text-white hover:bg-violet-light transition-colors shadow-[0_8px_24px_rgba(110,86,207,0.35)] flex items-center gap-2",
            children: [
              (0, u.jsx)("span", { children: "⚙️" }),
              " Entrar na Área dos Pais"
            ]
          })
        ]
      }) : (0, u.jsx)("ul", {
        className: "grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 content-start",
        children: e.map(e => {
          let l = t.filter(t => t.deckId === e.id),
            dueCount = l.filter(X).length;
          return (0, u.jsxs)("li", {
            className: "group relative bg-base-surface/80 border border-base-line rounded-2xl p-5 hover:border-violet/50 hover:bg-base-surface transition-all flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
            children: [
              (0, u.jsxs)("button", {
                className: "text-left w-full flex-1 flex flex-col justify-between",
                onClick: () => n(e.id),
                children: [
                  (0, u.jsxs)("div", {
                    className: "flex items-start justify-between gap-3 mb-4",
                    children: [
                      (0, u.jsxs)("div", {
                        className: "min-w-0 flex-1",
                        children: [
                          (0, u.jsx)("h2", { className: "font-display font-semibold text-xl text-white group-hover:text-violet-light transition-colors truncate", children: e.name }),
                          e.description ? (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-1 line-clamp-2", children: e.description }) : null
                        ]
                      }),
                      dueCount > 0 ? (0, u.jsxs)("span", {
                        className: "shrink-0 font-mono text-xs font-semibold rounded-full bg-coral-dim text-coral px-3 py-1",
                        children: [dueCount, " para estudar"]
                      }) : (0, u.jsx)("span", {
                        className: "shrink-0 font-mono text-[10px] text-teal rounded-full bg-teal-dim px-2.5 py-1 uppercase tracking-wider font-semibold",
                        children: "✓ em dia"
                      })
                    ]
                  }),
                  (0, u.jsxs)("div", {
                    className: "pt-3 border-t border-base-line/60 flex items-center justify-between text-ink-soft font-mono text-xs",
                    children: [
                      (0, u.jsxs)("span", { children: [l.length, " palavras no baralho"] }),
                      (0, u.jsx)("span", { className: "text-violet-light font-body font-medium", children: "Iniciar estudo ➔" })
                    ]
                  })
                ]
              }),
              isParent ? (0, u.jsxs)("div", {
                className: "mt-3 pt-2 border-t border-base-line/40 flex justify-end gap-2",
                children: [
                  (0, u.jsx)("button", {
                    onClick: () => r(e),
                    className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-base-raised text-ink-soft hover:text-ink transition-colors",
                    children: "editar"
                  }),
                  (0, u.jsx)("button", {
                    onClick: () => a(e.id),
                    className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-coral-dim text-coral hover:bg-coral hover:text-white transition-colors",
                    children: "excluir"
                  })
                ]
              }) : null
            ]
          }, e.id);
        })
      })
    ]
  });
}

let ei = { new: "novo", learning: "aprendendo", mature: "maduro" },
  eo = { new: "text-ink-soft", learning: "text-amber", mature: "text-teal" };

function es({ deck: e, cards: t, isParentMode: isParent, onBack: n, onStudy: r, onNewCard: a, onEditCard: l, onDeleteCard: i }) {
  let o = t.filter(X).length;
  return (0, u.jsxs)("div", {
    className: "max-w-3xl mx-auto px-4 sm:px-6 py-8 min-h-screen flex flex-col",
    children: [
      (0, u.jsx)("button", {
        onClick: n,
        className: "font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-ink mb-6 transition-colors self-start flex items-center gap-1.5",
        children: "← Voltar aos baralhos"
      }),
      (0, u.jsxs)("header", {
        className: "mb-6 pb-6 border-b border-base-line flex items-end justify-between gap-4 flex-wrap",
        children: [
          (0, u.jsxs)("div", {
            className: "min-w-0 flex-1",
            children: [
              (0, u.jsx)("p", { className: "font-mono text-[11px] tracking-[0.2em] text-ink-soft uppercase mb-1", children: "BARALHO SELECIONADO" }),
              (0, u.jsx)("h1", { className: "font-display font-semibold text-2xl sm:text-3xl text-white truncate", children: e.name }),
              e.description ? (0, u.jsx)("p", { className: "text-xs text-ink-soft mt-1", children: e.description }) : null
            ]
          }),
          (0, u.jsxs)("button", {
            onClick: r,
            disabled: 0 === o,
            className: "shrink-0 font-body text-base font-semibold rounded-full bg-violet px-6 py-3.5 text-white hover:bg-violet-light shadow-[0_8px_24px_rgba(110,86,207,0.35)] transition-all disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2",
            children: [
              (0, u.jsx)("span", { children: "📖" }),
              " Começar Leitura (", o, ")"
            ]
          })
        ]
      }),
      (0, u.jsxs)("div", {
        className: "flex items-center justify-between mb-4",
        children: [
          (0, u.jsxs)("p", { className: "font-mono text-[11px] uppercase tracking-wide text-ink-soft", children: [t.length, " fichas cadastradas"] }),
          isParent ? (0, u.jsx)("button", {
            onClick: a,
            className: "font-body text-xs font-medium rounded-full bg-base-raised px-4 py-2 hover:bg-base-strong text-white transition-colors flex items-center gap-1.5",
            children: [(0, u.jsx)("span", { children: "➕" }), " Nova ficha"]
          }) : null
        ]
      }),
      0 === t.length ? (0, u.jsxs)("div", {
        className: "border border-dashed border-base-strong rounded-2xl py-14 text-center bg-base-surface/40 flex-1 flex flex-col items-center justify-center",
        children: [
          (0, u.jsx)("p", { className: "font-display font-medium text-lg mb-2 text-white", children: "Nenhuma ficha ainda" }),
          (0, u.jsx)("p", { className: "text-sm text-ink-soft mb-4", children: "Adicione palavras ou frases a este baralho para começar." }),
          isParent ? (0, u.jsx)("button", {
            onClick: a,
            className: "font-body text-xs font-medium rounded-full bg-violet px-4 py-2 text-white hover:bg-violet-light transition-colors",
            children: "+ Adicionar primeira ficha"
          }) : null
        ]
      }) : (0, u.jsx)("ul", {
        className: "rounded-2xl border border-base-line bg-base-surface/70 divide-y divide-base-line overflow-hidden",
        children: t.map(e => {
          let t = Z(e);
          return (0, u.jsxs)("li", {
            className: "group px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-base-raised/60 transition-colors",
            children: [
              (0, u.jsxs)("div", {
                className: "min-w-0 flex-1",
                children: [
                  (0, u.jsxs)("div", {
                    className: "flex items-center gap-2 flex-wrap",
                    children: [
                      (0, u.jsx)("span", { className: "font-medium text-white text-base", children: e.front }),
                      (0, u.jsx)("button", {
                        onClick: () => e.frontAudio ? new Audio(e.frontAudio).play().catch(() => {}) : speakWordTTS(e.front),
                        className: "shrink-0 text-ink-soft hover:text-violet-light transition-colors text-sm",
                        title: e.frontAudio ? "Ouvir gravação" : "Ouvir pronúncia automática (TTS)",
                        children: "🔊"
                      }),
                      (0, u.jsxs)("span", { className: "text-ink-soft text-sm", children: [" — ", e.back] }),
                      (0, u.jsx)("button", {
                        onClick: () => e.backAudio ? new Audio(e.backAudio).play().catch(() => {}) : speakWordTTS(e.back),
                        className: "shrink-0 text-ink-soft hover:text-violet-light transition-colors text-sm",
                        title: e.backAudio ? "Ouvir gravação" : "Ouvir pronúncia automática (TTS)",
                        children: "🔊"
                      })
                    ]
                  }),
                  (0, u.jsxs)("p", {
                    className: "font-mono text-[10px] uppercase tracking-wide mt-1 flex gap-3 flex-wrap text-ink-soft",
                    children: [
                      (0, u.jsx)("span", { className: eo[t], children: ei[t] }),
                      (0, u.jsxs)("span", { className: "text-ink-soft/70", children: ["intervalo ", J(e.scheduled_days)] }),
                      e.readingTime ? (0, u.jsxs)("span", { className: "text-violet-light font-medium", children: ["⏱️ ", e.readingTime, "s"] }) : null,
                      X(e) ? (0, u.jsx)("span", { className: "text-coral font-medium", children: "• para hoje" }) : null
                    ]
                  })
                ]
              }),
              isParent ? (0, u.jsxs)("div", {
                className: "shrink-0 flex gap-1.5",
                children: [
                  (0, u.jsx)("button", {
                    onClick: () => l(e),
                    className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-base-raised text-ink-soft hover:text-ink transition-colors",
                    children: "editar"
                  }),
                  (0, u.jsx)("button", {
                    onClick: () => i(e.id),
                    className: "font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-coral-dim text-coral hover:bg-coral hover:text-white transition-colors",
                    children: "excluir"
                  })
                ]
              }) : null
            ]
          }, e.id);
        })
      })
    ]
  });
}

var c = o("dtVek");

function ed({ deck: e, dueCards: t, aiSettings: aiCfg, onRate: n, onSaveSession: r, onExit: a }) {
  let [l, i] = (0, c.useState)(0),
    [o, s] = (0, c.useState)(!1),
    d = t.length,
    f = t[l],
    p = (0, c.useRef)(Date.now()),
    h = (0, c.useRef)({
      correct: 0,
      wrong: 0,
      total: 0,
      cardStartTime: Date.now(),
      flipTime: Date.now(),
      audioPlaysCount: 0,
      struggledList: [],
      voiceAttempts: []
    }),
    [m, g] = (0, c.useState)(null),
    [isListening, setIsListening] = (0, c.useState)(!1),
    [isAnalyzingAI, setIsAnalyzingAI] = (0, c.useState)(!1),
    [voiceFeedback, setVoiceFeedback] = (0, c.useState)(null),
    recRef = (0, c.useRef)(null),
    mediaStreamRef = (0, c.useRef)(null),
    recordedAudioChunks = (0, c.useRef)([]);

  (0, c.useEffect)(() => {
    if (f) {
      h.current.cardStartTime = Date.now();
      h.current.flipTime = 0;
      h.current.audioPlaysCount = 0;
      setVoiceFeedback(null);
      setIsListening(!1);
      setIsAnalyzingAI(!1);
    }
  }, [l, f]);

  function y() {
    let e = !o;
    s(e);
    if (e) {
      h.current.flipTime = Date.now();
      if (f && f.backAudio) {
        ec(f.backAudio, f.back);
      }
    }
  }

  function handlePlayFrontAudio(e) {
    e.stopPropagation();
    h.current.audioPlaysCount += 1;
    ec(f.frontAudio, f.front);
  }

  async function startVoiceRecognition() {
    if (isListening || !f) return;
    setVoiceFeedback(null);

    let useGemini = aiCfg?.provider === "gemini" && !!aiCfg?.geminiKey;

    if (useGemini) {
      try {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: !0 });
        mediaStreamRef.current = stream;
        let recorder = new MediaRecorder(stream);
        recordedAudioChunks.current = [];
        recorder.ondataavailable = e => {
          if (e.data.size > 0) recordedAudioChunks.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          setIsListening(!1);
          setIsAnalyzingAI(!0);
          try {
            let blob = new Blob(recordedAudioChunks.current, { type: recorder.mimeType || "audio/webm" });
            let reader = new FileReader();
            reader.onloadend = async () => {
              try {
                let base64 = reader.result;
                let res = await analyzeWithGemini(base64, recorder.mimeType, f.front, aiCfg.geminiKey, aiCfg.geminiModel);
                setVoiceFeedback(res);
                h.current.voiceAttempts.push({ word: f.front, spoken: res.spokenText, accuracy: res.accuracy, feedback: res.feedback });
                setIsAnalyzingAI(!1);
                if (!o) s(!0);
              } catch (err) {
                console.warn("Fallback to native recognition:", err);
                fallbackNativeRecognition();
              }
            };
            reader.readAsDataURL(blob);
          } catch (e) {
            setIsAnalyzingAI(!1);
          }
        };
        recorder.start();
        recRef.current = recorder;
        setIsListening(!0);
      } catch (err) {
        fallbackNativeRecognition();
      }
    } else {
      fallbackNativeRecognition();
    }
  }

  function fallbackNativeRecognition() {
    let SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Reconhecimento de voz não suportado neste navegador. Use Google Chrome ou Android.");
      return;
    }
    try {
      let recognition = new SpeechRec();
      recognition.lang = "pt-BR";
      recognition.interimResults = !1;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(!0);
        setIsAnalyzingAI(!1);
      };

      recognition.onresult = event => {
        let transcript = event.results?.[0]?.[0]?.transcript || "";
        let acc = calculateSpeechAccuracy(transcript, f.front);
        let fb = {
          spokenText: transcript,
          accuracy: acc,
          feedback: acc >= 80 ? "🌟 Excelente leitura!" : acc >= 50 ? "🟨 Quase lá! Pratique o som." : "❌ Pratique mais uma vez.",
          quality: acc >= 80 ? "excelente" : acc >= 50 ? "quase_la" : "precisa_praticar",
          isAI: !1
        };
        setVoiceFeedback(fb);
        h.current.voiceAttempts.push({ word: f.front, spoken: transcript, accuracy: acc, feedback: fb.feedback });
        setIsListening(!1);
        if (!o) s(!0);
      };

      recognition.onerror = () => {
        setIsListening(!1);
      };

      recognition.onend = () => {
        setIsListening(!1);
      };

      recRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(!1);
    }
  }

  function stopVoiceRecognition() {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch (e) {}
    }
  }

  let v = (0, c.useMemo)(() => {
    if (!f) return {};
    let e = {};
    return ["again", "hard", "good", "easy"].forEach(t => {
      let n;
      e[t] = J((n = new Date, (G.repeat(Y(f), n)[K[t]].card.due.getTime() - n.getTime()) / 864e5));
    }), e;
  }, [f]);

  function b(t) {
    let now = Date.now();
    let flipMoment = h.current.flipTime || now;
    let frontTimeSec = Math.max(0.5, (flipMoment - h.current.cardStartTime) / 1000);
    let audiosPlayed = h.current.audioPlaysCount;
    let cardLimitSec = f && f.readingTime ? Number(f.readingTime) : 7;
    let severeLimitSec = Math.max(cardLimitSec * 2, cardLimitSec + 8);

    h.current.total += 1;

    let effectiveRating = t;

    if (voiceFeedback) {
      if (voiceFeedback.accuracy >= 80) {
        effectiveRating = "good";
        h.current.correct += 1;
      } else if (voiceFeedback.accuracy >= 50) {
        effectiveRating = "hard";
        h.current.correct += 1;
        h.current.struggledList.push({
          word: f.front,
          reason: 'Voz: ' + voiceFeedback.accuracy + '% (falou "' + voiceFeedback.spokenText + '")',
          timeSec: Math.round(frontTimeSec),
          audioUsed: audiosPlayed > 0
        });
      } else {
        effectiveRating = "again";
        h.current.wrong += 1;
        h.current.struggledList.push({
          word: f.front,
          reason: "Voz incorreta (" + voiceFeedback.accuracy + "%)",
          timeSec: Math.round(frontTimeSec),
          audioUsed: audiosPlayed > 0
        });
      }
    } else {
      if ("again" === t) {
        h.current.wrong += 1;
        h.current.struggledList.push({
          word: f.front,
          reason: "Não lembrou (" + Math.round(frontTimeSec) + "s" + (audiosPlayed > 0 ? ", " + audiosPlayed + "x áudio" : "") + ")",
          timeSec: Math.round(frontTimeSec),
          audioUsed: audiosPlayed > 0
        });
        effectiveRating = "again";
      } else {
        if (audiosPlayed >= 2 || frontTimeSec >= severeLimitSec) {
          effectiveRating = "hard";
          h.current.struggledList.push({
            word: f.front,
            reason: "Dificuldade alta (" + Math.round(frontTimeSec) + "s / limite " + cardLimitSec + "s" + (audiosPlayed > 0 ? ", " + audiosPlayed + "x áudio" : "") + ")",
            timeSec: Math.round(frontTimeSec),
            audioUsed: !0
          });
        } else if (audiosPlayed >= 1) {
          effectiveRating = "hard";
          h.current.struggledList.push({
            word: f.front,
            reason: "Teve dúvida (precisou ouvir o áudio)",
            timeSec: Math.round(frontTimeSec),
            audioUsed: !0
          });
        } else if (frontTimeSec > cardLimitSec) {
          effectiveRating = "hard";
          h.current.struggledList.push({
            word: f.front,
            reason: "Hesitou na leitura (" + Math.round(frontTimeSec) + "s / limite " + cardLimitSec + "s)",
            timeSec: Math.round(frontTimeSec),
            audioUsed: !1
          });
        } else {
          effectiveRating = "good";
          h.current.correct += 1;
        }
      }
    }

    n(f, effectiveRating);
    s(!1);
    let oNext = l + 1;
    i(oNext);

    if (oNext >= d) {
      let nDuration = Math.max(1, Math.round((Date.now() - p.current) / 1000)),
        lTotal = h.current.total || 1,
        iCorrect = h.current.correct,
        sWrong = lTotal - iCorrect,
        uAccuracy = Math.round((iCorrect / lTotal) * 100),
        cAvg = (nDuration / lTotal).toFixed(1),
        dRecord = {
          deckName: e.name,
          date: new Date().toISOString(),
          durationSeconds: nDuration,
          totalReviews: lTotal,
          correctCount: iCorrect,
          wrongCount: sWrong,
          accuracy: uAccuracy,
          avgTimePerCard: parseFloat(cAvg),
          struggledCards: [...h.current.struggledList],
          voiceAttempts: [...h.current.voiceAttempts]
        };
      g(dRecord);
      if (r) r(dRecord);
    }
  }

  function x(e) {
    if (!e || e < 60) return (e || 0) + "s";
    let t = Math.floor(e / 60),
      n = e % 60;
    return t + "m " + (n < 10 ? "0" : "") + n + "s";
  }

  if (m || !f) {
    let t = m || {
        durationSeconds: Math.round((Date.now() - p.current) / 1000),
        totalReviews: h.current.total,
        correctCount: h.current.correct,
        wrongCount: (h.current.total || 1) - h.current.correct,
        accuracy: Math.round((h.current.correct / (h.current.total || 1)) * 100),
        avgTimePerCard: (Math.round((Date.now() - p.current) / 1000) / (h.current.total || 1)).toFixed(1),
        struggledCards: h.current.struggledList || [],
        voiceAttempts: h.current.voiceAttempts || []
      },
      n = t.avgTimePerCard && parseFloat(t.avgTimePerCard) < 3,
      hasStruggles = t.struggledCards && t.struggledCards.length > 0,
      hasVoice = t.voiceAttempts && t.voiceAttempts.length > 0;

    return (0, u.jsxs)("div", {
      className: "max-w-lg mx-auto px-4 sm:px-6 py-10 text-center animate-in fade-in-0 duration-300 min-h-screen flex flex-col justify-center items-center",
      children: [
        (0, u.jsx)("div", { className: "text-5xl mb-3", children: "🎉" }),
        (0, u.jsx)("p", { className: "font-display font-semibold text-2xl sm:text-3xl text-white mb-1", children: "Sessão Concluída!" }),
        (0, u.jsxs)("p", { className: "text-xs sm:text-sm text-ink-soft mb-6", children: ['Você terminou todas as fichas de "', e.name, '".'] }),
        (0, u.jsxs)("div", {
          className: "grid grid-cols-3 gap-2.5 sm:gap-3 w-full mb-6",
          children: [
            (0, u.jsxs)("div", {
              className: "p-3.5 rounded-2xl bg-base-surface border border-base-line text-center",
              children: [
                (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "⏱️ Tempo" }),
                (0, u.jsx)("p", { className: "font-display font-semibold text-base sm:text-lg text-white mt-1", children: x(t.durationSeconds) })
              ]
            }),
            (0, u.jsxs)("div", {
              className: "p-3.5 rounded-2xl bg-base-surface border border-base-line text-center",
              children: [
                (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "🎯 Leitura" }),
                (0, u.jsxs)("p", { className: "font-display font-semibold text-base sm:text-lg text-teal mt-1", children: [t.accuracy, "%"] })
              ]
            }),
            (0, u.jsxs)("div", {
              className: "p-3.5 rounded-2xl bg-base-surface border border-base-line text-center",
              children: [
                (0, u.jsx)("p", { className: "font-mono text-[10px] uppercase text-ink-soft", children: "⚡ Ritmo" }),
                (0, u.jsxs)("p", { className: "font-display font-semibold text-base sm:text-lg text-violet-light mt-1", children: [t.avgTimePerCard, "s"] })
              ]
            })
          ]
        }),
        hasVoice ? (0, u.jsxs)("div", {
          className: "w-full mb-6 p-4 rounded-2xl bg-base-surface border border-violet/40 text-left space-y-2",
          children: [
            (0, u.jsx)("p", { className: "font-display font-medium text-xs text-violet-light flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "🎙️" }), " Avaliação de Leitura de Voz realizada:"] }),
            (0, u.jsx)("ul", {
              className: "space-y-1.5 pl-1 font-mono text-xs text-ink-soft max-h-36 overflow-y-auto",
              children: t.voiceAttempts.map((va, vaIdx) => (0, u.jsxs)("li", {
                className: "flex items-center justify-between gap-2 border-b border-base-line/40 pb-1",
                children: [
                  (0, u.jsxs)("span", { children: [(0, u.jsx)("b", { className: "text-white", children: va.word }), ' ➔ "', va.spoken, '"'] }),
                  (0, u.jsxs)("span", { className: "font-semibold " + (va.accuracy >= 80 ? "text-teal" : va.accuracy >= 50 ? "text-amber" : "text-coral"), children: [va.accuracy, "%"] })
                ]
              }, vaIdx))
            })
          ]
        }) : null,
        hasStruggles ? (0, u.jsxs)("div", {
          className: "w-full mb-6 p-4 rounded-2xl bg-base-surface border border-base-line text-left space-y-2",
          children: [
            (0, u.jsx)("p", { className: "font-display font-medium text-xs text-amber flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "🔍" }), " Palavras para reforçar:"] }),
            (0, u.jsx)("ul", {
              className: "space-y-1 pl-1 font-mono text-xs text-ink-soft max-h-36 overflow-y-auto",
              children: t.struggledCards.map((sc, scIdx) => (0, u.jsxs)("li", {
                className: "flex items-center justify-between gap-2 border-b border-base-line/40 pb-1",
                children: [
                  (0, u.jsx)("span", { className: "text-white font-medium", children: sc.word }),
                  (0, u.jsx)("span", { className: "text-[10px] text-ink-soft/80", children: sc.reason })
                ]
              }, scIdx))
            })
          ]
        }) : null,
        n ? (0, u.jsxs)("div", {
          className: "w-full mb-6 p-3 rounded-2xl bg-amber-dim border border-amber/30 text-amber font-mono text-xs text-left flex items-start gap-2",
          children: [
            (0, u.jsx)("span", { children: "⚠️" }),
            (0, u.jsx)("span", { children: "Sessão rápida (" + t.avgTimePerCard + "s por ficha). Leia com calma antes de virar!" })
          ]
        }) : null,
        (0, u.jsx)("button", {
          onClick: a,
          className: "font-body text-sm font-semibold rounded-full bg-violet px-8 py-3.5 text-white hover:bg-violet-light shadow-[0_8px_24px_rgba(110,86,207,0.35)] transition-all",
          children: "Voltar ao baralho"
        })
      ]
    });
  }

  return (0, u.jsxs)("div", {
    className: "max-w-md mx-auto px-4 py-6 flex flex-col justify-between min-h-screen",
    children: [
      (0, u.jsxs)("div", {
        className: "w-full space-y-3",
        children: [
          (0, u.jsxs)("div", {
            className: "flex items-center justify-between",
            children: [
              (0, u.jsx)("button", {
                onClick: a,
                className: "font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-white transition-colors flex items-center gap-1",
                children: "← Sair"
              }),
              (0, u.jsxs)("p", {
                className: "font-mono text-xs uppercase tracking-wider text-ink-soft font-semibold",
                children: [l + 1, " de ", d]
              })
            ]
          }),
          (0, u.jsx)("div", {
            className: "h-1.5 w-full rounded-full bg-base-line overflow-hidden",
            children: (0, u.jsx)("div", {
              className: "h-full bg-violet transition-all duration-300",
              style: { width: ((l + 1) / d * 100) + "%" }
            })
          })
        ]
      }),
      (0, u.jsx)("div", {
        className: "w-full my-auto py-4",
        children: (0, u.jsx)("div", {
          className: "flip-card w-full h-[320px] sm:h-[360px]",
          onClick: y,
          children: (0, u.jsxs)("div", {
            className: "flip-card-inner relative w-full h-full cursor-pointer " + (o ? "is-flipped" : ""),
            children: [
              (0, u.jsxs)("div", {
                className: "flip-face absolute inset-0 rounded-3xl border border-base-line bg-base-surface shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-between p-7 text-center",
                children: [
                  (0, u.jsxs)("div", {
                    className: "w-full flex items-center justify-between",
                    children: [
                      (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase tracking-wider text-ink-soft font-medium", children: "Palavra" }),
                      (0, u.jsxs)("button", {
                        type: "button",
                        onClick: handlePlayFrontAudio,
                        className: "px-3 py-1 rounded-full bg-base-raised hover:bg-violet/20 text-xs text-ink-soft hover:text-violet-light border border-base-line transition-all flex items-center gap-1.5",
                        title: "Ouvir áudio da palavra (indica dúvida)",
                        children: [
                          (0, u.jsx)("span", { children: "🔊" }),
                          (0, u.jsx)("span", { className: "font-mono text-[10px] font-medium", children: "Dica de Áudio" })
                        ]
                      })
                    ]
                  }),
                  (0, u.jsx)("div", {
                    className: "my-auto",
                    children: (0, u.jsx)("p", { className: "font-display font-bold text-4xl sm:text-5xl tracking-wide text-white leading-tight", children: f.front })
                  }),
                  (0, u.jsx)("p", { className: "font-mono text-[11px] uppercase tracking-wider text-violet-light font-medium", children: "toque para virar a ficha 👆" })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "flip-face flip-face-back absolute inset-0 rounded-3xl border border-violet/40 bg-base-surface shadow-[0_20px_50px_rgba(110,86,207,0.25)] flex flex-col items-center justify-between p-7 text-center",
                children: [
                  (0, u.jsxs)("div", {
                    className: "w-full flex items-center justify-between",
                    children: [
                      (0, u.jsx)("span", { className: "font-mono text-[10px] uppercase tracking-wider text-violet-light font-semibold", children: "Significado / Resposta" }),
                      (0, u.jsx)("button", {
                        onClick: e => { e.stopPropagation(); ec(f.backAudio, f.back); },
                        className: "text-lg text-violet-light hover:scale-110 transition-transform",
                        title: "Ouvir resposta",
                        children: "🔊"
                      })
                    ]
                  }),
                  (0, u.jsx)("div", {
                    className: "my-auto",
                    children: (0, u.jsx)("p", { className: "font-display font-medium text-2xl sm:text-3xl text-white leading-snug", children: f.back })
                  }),
                  (0, u.jsx)("p", { className: "font-mono text-[11px] uppercase tracking-wider text-ink-soft", children: "Avalie como foi a sua leitura abaixo 👇" })
                ]
              })
            ]
          })
        })
      }),
      (0, u.jsxs)("div", {
        className: "w-full space-y-3 pt-2 pb-4",
        children: [
          voiceFeedback ? (0, u.jsxs)("div", {
            className: "p-3 rounded-2xl border text-center font-mono text-xs space-y-0.5 animate-in fade-in-0 " + (voiceFeedback.accuracy >= 80 ? "bg-teal-dim border-teal/40 text-teal" : voiceFeedback.accuracy >= 50 ? "bg-amber-dim border-amber/40 text-amber" : "bg-coral-dim border-coral/40 text-coral"),
            children: [
              (0, u.jsxs)("p", { className: "font-semibold text-sm", children: [voiceFeedback.feedback, " (", voiceFeedback.accuracy, "% de acerto)"] }),
              voiceFeedback.spokenText ? (0, u.jsxs)("p", { className: "text-[11px] opacity-90", children: ['Você falou: "', voiceFeedback.spokenText, '"'] }) : null
            ]
          }) : null,
          !o ? (0, u.jsxs)("div", {
            className: "space-y-2.5",
            children: [
              isListening ? (0, u.jsxs)("button", {
                type: "button",
                onClick: stopVoiceRecognition,
                className: "w-full py-4 rounded-2xl bg-coral text-white font-body text-base font-semibold animate-pulse flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(229,72,77,0.4)]",
                children: [
                  (0, u.jsx)("span", { children: "⏹" }),
                  " Ouvindo você falar... Toque para parar"
                ]
              }) : isAnalyzingAI ? (0, u.jsxs)("div", {
                className: "w-full py-4 rounded-2xl bg-violet/20 text-violet-light font-body text-sm font-medium flex items-center justify-center gap-2 border border-violet/40",
                children: [
                  (0, u.jsx)("span", { className: "animate-spin", children: "✨" }),
                  " IA avaliando leitura..."
                ]
              }) : (0, u.jsxs)("button", {
                type: "button",
                onClick: startVoiceRecognition,
                className: "w-full py-4 rounded-2xl bg-violet text-white hover:bg-violet-light font-body text-base font-semibold shadow-[0_8px_24px_rgba(110,86,207,0.35)] transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]",
                children: [
                  (0, u.jsx)("span", { className: "text-xl", children: "🎙️" }),
                  " FALE (Ler em voz alta)"
                ]
              }),
              (0, u.jsx)("button", {
                onClick: y,
                className: "w-full font-body text-xs font-medium rounded-xl bg-base-raised/70 border border-base-line py-3 text-ink-soft hover:text-white transition-all text-center",
                children: "ou mostrar resposta sem gravar ➔"
              })
            ]
          }) : (0, u.jsxs)("div", {
            className: "grid grid-cols-2 gap-3 animate-in fade-in-0",
            children: [
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => b("again"),
                className: "rounded-2xl py-4 flex flex-col items-center justify-center gap-1 bg-coral-dim border border-coral/30 text-coral hover:bg-coral hover:text-white transition-all shadow-sm active:scale-[0.98]",
                children: [
                  (0, u.jsxs)("span", { className: "font-body text-base font-semibold flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "❌" }), " Não Lembrei"] }),
                  (0, u.jsxs)("span", { className: "font-mono text-xs opacity-80", children: ["rever em ", v.again || "1m"] })
                ]
              }),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => b("good"),
                className: "rounded-2xl py-4 flex flex-col items-center justify-center gap-1 bg-teal-dim border border-teal/30 text-teal hover:bg-teal hover:text-white transition-all shadow-sm active:scale-[0.98]",
                children: [
                  (0, u.jsxs)("span", { className: "font-body text-base font-semibold flex items-center gap-1.5", children: [(0, u.jsx)("span", { children: "✅" }), " Acertei!"] }),
                  (0, u.jsxs)("span", { className: "font-mono text-xs opacity-80", children: ["rever em ", v.good || "1d"] })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

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

function ep({ initial: e, onSave: t, onCancel: n }) {
  let [r, a] = (0, c.useState)(e?.name ?? ""),
    [l, i] = (0, c.useState)(e?.description ?? "");
  return (0, u.jsxs)("form", {
    className: "space-y-4",
    onSubmit: e => { e.preventDefault(); r.trim() && t(r.trim(), l.trim()); },
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

function em({ initial: e, onSave: t, onCancel: n }) {
  let [r, a] = (0, c.useState)(e?.front ?? ""),
    [l, i] = (0, c.useState)(e?.back ?? ""),
    [o, s] = (0, c.useState)(e?.frontAudio),
    [d, f] = (0, c.useState)(e?.backAudio),
    [timeSec, setTimeSec] = (0, c.useState)(e?.readingTime ? Number(e.readingTime) : 7);

  return (0, u.jsxs)("form", {
    className: "space-y-4",
    onSubmit: e => {
      e.preventDefault();
      r.trim() && l.trim() && t(r.trim(), l.trim(), o, d, Number(timeSec) || 7);
    },
    children: [
      (0, u.jsxs)("div", {
        children: [
          (0, u.jsx)("label", { className: "font-mono text-[10px] uppercase tracking-wide text-ink-soft", children: "Frente (Palavra / Frase)" }),
          (0, u.jsx)("textarea", {
            autoFocus: !0,
            value: r,
            onChange: e => a(e.target.value),
            rows: 2,
            placeholder: "ex.: BOLA ou O cachorro late",
            className: "mt-1.5 w-full bg-base-raised border border-base-line rounded-xl px-3 py-2.5 outline-none focus:border-violet transition-colors resize-none text-white text-sm"
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

let eg = document.createElement("link");
eg.rel = "stylesheet";
eg.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
document.head.appendChild(eg);

(0, d.createRoot)(document.getElementById("root")).render(
  (0, u.jsx)(c.StrictMode, {
    children: (0, u.jsx)(function() {
      let [e, t] = (0, c.useState)([]),
        [n, r] = (0, c.useState)([]),
        [a, l] = (0, c.useState)(!1),
        [i, o] = (0, c.useState)("list"),
        [s, d] = (0, c.useState)(null),
        [f, p] = (0, c.useState)(null),
        [h, m] = (0, c.useState)(null),
        [kBackup, setKBackup] = (0, c.useState)(!1),
        [kStats, setKStats] = (0, c.useState)(!1),
        [isParentMode, setIsParentMode] = (0, c.useState)(!1),
        [showParentAuth, setShowParentAuth] = (0, c.useState)(!1),
        [history, setHistory] = (0, c.useState)([]),
        [aiSettings, setAISettings] = (0, c.useState)({ provider: "native", geminiKey: "", geminiModel: "gemini-2.0-flash" }),
        g = (0, c.useRef)([]);

      (0, c.useEffect)(() => {
        (async () => {
          let [e, n, h, ai] = await Promise.all([ee(en, []), ee(er, []), ee(ehistory, []), ee(eaisettings, { provider: "native", geminiKey: "", geminiModel: "gemini-2.0-flash" })]);
          t(e), r(n), setHistory(h), setAISettings(ai || { provider: "native", geminiKey: "", geminiModel: "gemini-2.0-flash" }), l(!0);
        })();
      }, []);

      (0, c.useEffect)(() => {
        a && et(en, e);
      }, [e, a]);

      (0, c.useEffect)(() => {
        a && et(er, n);
      }, [n, a]);

      (0, c.useEffect)(() => {
        a && et(ehistory, history);
      }, [history, a]);

      (0, c.useEffect)(() => {
        a && et(eaisettings, aiSettings);
      }, [aiSettings, a]);

      function handleSaveSessionStats(record) {
        setHistory(prev => [...prev, record]);
      }

      function handleClearHistory() {
        setHistory([]);
      }

      function handleSaveAISettings(newCfg) {
        setAISettings(newCfg);
      }

      function handleToggleParentMode() {
        if (isParentMode) {
          setIsParentMode(!1);
        } else {
          setShowParentAuth(!0);
        }
      }

      function handleImport(importedData, mode) {
        let newDecks = Array.isArray(importedData.decks) ? importedData.decks : [];
        let newCards = Array.isArray(importedData.cards) ? importedData.cards : [];
        let newHist = Array.isArray(importedData.history) ? importedData.history : [];
        let newAI = importedData.aiSettings || null;
        if ("replace" === mode) {
          t(newDecks);
          r(newCards);
          setHistory(newHist);
          if (newAI) setAISettings(newAI);
        } else {
          t(prevDecks => {
            let map = new Map();
            prevDecks.forEach(d => map.set(d.id, d));
            newDecks.forEach(d => map.set(d.id, { ...map.get(d.id), ...d }));
            return Array.from(map.values());
          });
          r(prevCards => {
            let map = new Map();
            prevCards.forEach(c => map.set(c.id, c));
            newCards.forEach(c => map.set(c.id, { ...map.get(c.id), ...c }));
            return Array.from(map.values());
          });
          setHistory(prevHist => {
            let existingDates = new Set(prevHist.map(h => h.date));
            let filtered = newHist.filter(h => !existingDates.has(h.date));
            return [...prevHist, ...filtered];
          });
          if (newAI && newAI.geminiKey) setAISettings(newAI);
        }
      }

      let y = e.find(e => e.id === s) ?? null,
        v = n.filter(e => e.deckId === s).sort((e, t) => e.front.localeCompare(t.front));

      return a ? (0, u.jsxs)("div", {
        className: "min-h-screen catalog-scrollbar",
        children: [
          "list" === i && (0, u.jsx)(el, {
            decks: e,
            cards: n,
            isParentMode: isParentMode,
            onToggleParentMode: handleToggleParentMode,
            onOpenDeck: e => { d(e), o("deck"); },
            onEditDeck: e => p({ mode: "edit", deck: e }),
            onDeleteDeck: function(e) {
              confirm("Excluir este baralho e todas as suas fichas?") && (
                t(t => t.filter(t => t.id !== e)),
                r(t => t.filter(t => t.deckId !== e)),
                s === e && (d(null), o("list"))
              );
            },
            onNewDeck: () => p({ mode: "new" }),
            onOpenBackup: () => setKBackup(!0),
            onOpenStats: () => setKStats(!0)
          }),
          "deck" === i && y && (0, u.jsx)(es, {
            deck: y,
            cards: v,
            isParentMode: isParentMode,
            onBack: () => o("list"),
            onStudy: function() { g.current = v.filter(X), o("study"); },
            onNewCard: () => m({ mode: "new" }),
            onEditCard: e => m({ mode: "edit", card: e }),
            onDeleteCard: function(e) {
              confirm("Excluir esta ficha?") && r(t => t.filter(t => t.id !== e));
            }
          }),
          "study" === i && y && (0, u.jsx)(ed, {
            deck: y,
            dueCards: g.current,
            aiSettings: aiSettings,
            onSaveSession: handleSaveSessionStats,
            onRate: function(e, t) {
              r(n => n.map(n => {
                let r, a;
                return n.id === e.id ? (
                  r = new Date,
                  a = G.repeat(Y(n), r)[K[t]].card,
                  {
                    ...n,
                    due: a.due.toISOString(),
                    stability: a.stability,
                    difficulty: a.difficulty,
                    elapsed_days: a.elapsed_days,
                    scheduled_days: a.scheduled_days,
                    learning_steps: a.learning_steps,
                    reps: a.reps,
                    lapses: a.lapses,
                    state: a.state,
                    last_review: a.last_review ? a.last_review.toISOString() : null
                  }
                ) : n;
              }));
            },
            onExit: () => o("deck")
          }),
          showParentAuth && (0, u.jsx)(ParentAuthModal, {
            onSuccess: () => { setShowParentAuth(!1); setIsParentMode(!0); },
            onClose: () => setShowParentAuth(!1)
          }),
          f && (0, u.jsx)(ef, {
            title: "new" === f.mode ? "Novo baralho" : "Editar baralho",
            onClose: () => p(null),
            children: (0, u.jsx)(ep, {
              initial: "edit" === f.mode ? f.deck : void 0,
              onCancel: () => p(null),
              onSave: (e, n) => {
                var r;
                let a;
                return "new" === f.mode ? (
                  a = { id: ea(), name: e, description: n, createdAt: new Date().toISOString() },
                  void(t(e => [...e, a]), p(null))
                ) : (
                  r = f.deck.id,
                  void(t(t => t.map(t => t.id === r ? { ...t, name: e, description: n } : t)), p(null))
                );
              }
            })
          }),
          h && (0, u.jsx)(ef, {
            title: "new" === h.mode ? "Nova ficha" : "Editar ficha",
            onClose: () => m(null),
            children: (0, u.jsx)(em, {
              initial: "edit" === h.mode ? h.card : void 0,
              onCancel: () => m(null),
              onSave: (frontText, backText, frontAud, backAud, readingTimeSec) => {
                var l;
                return "new" === h.mode ? function(frontText, backText, frontAud, backAud, readingTimeSec) {
                  let l;
                  if (!s) return;
                  let i = {
                    id: ea(),
                    deckId: s,
                    front: frontText,
                    back: backText,
                    frontAudio: frontAud,
                    backAudio: backAud,
                    readingTime: readingTimeSec || 7,
                    ...{
                      due: (l = I(new Date)).due.toISOString(),
                      stability: l.stability,
                      difficulty: l.difficulty,
                      elapsed_days: l.elapsed_days,
                      scheduled_days: l.scheduled_days,
                      learning_steps: l.learning_steps,
                      reps: l.reps,
                      lapses: l.lapses,
                      state: l.state,
                      last_review: null
                    },
                    createdAt: new Date().toISOString()
                  };
                  r(e => [...e, i]), m(null);
                }(frontText, backText, frontAud, backAud, readingTimeSec) : (
                  l = h.card.id,
                  void(r(r => r.map(r => r.id === l ? {
                    ...r,
                    front: frontText,
                    back: backText,
                    frontAudio: frontAud,
                    backAudio: backAud,
                    readingTime: readingTimeSec || 7
                  } : r)), m(null))
                );
              }
            })
          }),
          kBackup && (0, u.jsx)(ef, {
            title: "Backup & Restauração",
            onClose: () => setKBackup(!1),
            children: (0, u.jsx)(eBackup, {
              decks: e,
              cards: n,
              history: history,
              aiSettings: aiSettings,
              onImport: handleImport,
              onClose: () => setKBackup(!1)
            })
          }),
          kStats && (0, u.jsx)(ef, {
            title: "Painel dos Pais · Relatório & IA",
            onClose: () => setKStats(!1),
            children: (0, u.jsx)(eParentStats, {
              history: history,
              aiSettings: aiSettings,
              onSaveAISettings: handleSaveAISettings,
              onClearHistory: handleClearHistory,
              onClose: () => setKStats(!1)
            })
          })
        ]
      }) : (0, u.jsx)("div", {
        className: "min-h-screen flex items-center justify-center bg-base",
        children: (0, u.jsx)("p", {
          className: "font-mono text-xs uppercase tracking-wide text-ink-soft",
          children: "Carregando seus baralhos…"
        })
      });
    }, {})
  })
);
</script>
`;

const completeHtml = htmlBeforeApp + newAppCode;

const scriptStart = completeHtml.indexOf('<script type="module">') + '<script type="module">'.length;
const scriptEnd = completeHtml.lastIndexOf("</script>");
const scriptContent = completeHtml.slice(scriptStart, scriptEnd);

try {
  new vm.Script(scriptContent);
  console.log("Validation SUCCESSFUL!");
  fs.writeFileSync("leaki.html", completeHtml);
  console.log("Saved leaki.html, size:", completeHtml.length);
} catch (e) {
  console.error("Syntax Error:", e);
  process.exit(1);
}
