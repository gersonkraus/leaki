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
      alert("Reconhecimento de voz não suportado neste navegador. Use Google Chrome ou Edge.");
      return;
    }
    try {
      let recognition = new SpeechRec();
      recognition.lang = "pt-BR";
      recognition.interimResults = !1;
      recognition.maxAlternatives = 1;
      let gotResult = !1;
      let timeoutId = null;

      recognition.onstart = () => {
        setIsListening(!0);
        setIsAnalyzingAI(!1);
        timeoutId = setTimeout(() => {
          if (!gotResult) {
            try { recognition.stop(); } catch (e) {}
          }
        }, 8000);
      };

      recognition.onresult = event => {
        gotResult = !0;
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        let transcript = event.results?.[0]?.[0]?.transcript || "";
        if (!transcript.trim()) {
          setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: "Não consegui ouvir. Tente falar mais perto do microfone.", quality: "precisa_praticar", isAI: !1 });
          setIsListening(!1);
          return;
        }
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

      recognition.onerror = event => {
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        console.warn("SpeechRecognition error:", event.error);
        setIsListening(!1);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: "Permissão do microfone negada. Permita o acesso ao microfone nas configurações do navegador.", quality: "precisa_praticar", isAI: !1 });
        } else if (event.error === "no-speech") {
          setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: "Nenhuma fala detectada. Tente falar mais alto e perto do microfone.", quality: "precisa_praticar", isAI: !1 });
        } else {
          setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: "Erro no reconhecimento de voz. Tente novamente.", quality: "precisa_praticar", isAI: !1 });
        }
      };

      recognition.onend = () => {
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        if (!gotResult && isListening) {
          setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: "Não consegui ouvir. Tente falar mais perto do microfone.", quality: "precisa_praticar", isAI: !1 });
        }
        setIsListening(!1);
      };

      recRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("SpeechRecognition init error:", e);
      setIsListening(!1);
      setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: "Não foi possível iniciar o reconhecimento de voz. Use Chrome ou Edge.", quality: "precisa_praticar", isAI: !1 });
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
                      e.audioHintEnabled ? (0, u.jsxs)("button", {
                        type: "button",
                        onClick: handlePlayFrontAudio,
                        className: "px-3 py-1 rounded-full bg-base-raised hover:bg-violet/20 text-xs text-ink-soft hover:text-violet-light border border-base-line transition-all flex items-center gap-1.5",
                        title: "Ouvir áudio da palavra (indica dúvida)",
                        children: [
                          (0, u.jsx)("span", { children: "🔊" }),
                          (0, u.jsx)("span", { className: "font-mono text-[10px] font-medium", children: "Dica de Áudio" })
                        ]
                      }) : null
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
              e.skipRecordingEnabled ? (0, u.jsx)("button", {
                onClick: y,
                className: "w-full font-body text-xs font-medium rounded-xl bg-base-raised/70 border border-base-line py-3 text-ink-soft hover:text-white transition-all text-center",
                children: "ou mostrar resposta sem gravar ➔"
              }) : null
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

