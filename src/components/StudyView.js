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
    [flipHint, setFlipHint] = (0, c.useState)(""),
    [needMicInfo, setNeedMicInfo] = (0, c.useState)(!wasMicExplained()),
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
      setFlipHint("");
    }
  }, [l, f]);

  let mustSpeak = !!e.requireSpeechToFlip;
  let evalRules = normalizeEvalRules(aiCfg && aiCfg.evalRules);

  function playBackSide() {
    if (f && f.backAudio) {
      ec(f.backAudio, f.back);
    } else if (f && f.back && e.audioHintEnabled) {
      speakWordTTS(f.back);
    }
  }

  function revealAfterSpeech() {
    h.current.flipTime = Date.now();
    setFlipHint("");
    s(!0);
    playBackSide();
  }

  function y() {
    if (mustSpeak) {
      if (o) return;
      if (!isValidSpeechResult(voiceFeedback)) {
        setFlipHint("Fale a palavra primeiro");
        return;
      }
      h.current.flipTime = Date.now();
      s(!0);
      playBackSide();
      return;
    }
    let isFlipped = !o;
    s(isFlipped);
    if (isFlipped) {
      if (!h.current.flipTime) h.current.flipTime = Date.now();
      playBackSide();
    }
  }

  function handlePlayFrontAudio(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    h.current.audioPlaysCount += 1;
    if (f.frontAudio) {
      ec(f.frontAudio, f.front);
    } else if (f.front) {
      speakWordTTS(f.front);
    }
  }

  function applySpeechResult(transcript, isAI) {
    let acc = calculateSpeechAccuracy(transcript, f.front, evalRules);
    let fb = {
      spokenText: transcript,
      accuracy: acc,
      feedback: feedbackFromAccuracy(acc),
      quality: speechQuality(acc),
      isAI: !!isAI
    };
    setVoiceFeedback(fb);
    h.current.voiceAttempts.push({ word: f.front, spoken: transcript, accuracy: acc, feedback: fb.feedback });
    if (!o) revealAfterSpeech();
  }

  async function startVoiceRecognition() {
    if (isListening || !f) return;
    if (needMicInfo || !wasMicExplained()) {
      setNeedMicInfo(!0);
      return;
    }
    setVoiceFeedback(null);
    setIsListening(!0);
    setIsAnalyzingAI(!1);

    let useOpenAI = aiCfg?.provider === "openai" && !!aiCfg?.openaiKey;
    let useGemini = aiCfg?.provider === "gemini" && !!aiCfg?.geminiKey;
    if (useOpenAI || useGemini) {
      try {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: !0 });
        mediaStreamRef.current = stream;
        let recorder = new MediaRecorder(stream);
        recordedAudioChunks.current = [];
        recorder.ondataavailable = ev => {
          if (ev.data.size > 0) recordedAudioChunks.current.push(ev.data);
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
                let res;
                if (useOpenAI) {
                  let spoken = await transcribeWithOpenAI(blob, aiCfg.openaiKey, aiCfg.openaiModel);
                  res = scoreLiteralTranscript(spoken, f.front, evalRules);
                } else {
                  res = await analyzeWithGemini(reader.result, recorder.mimeType, f.front, aiCfg.geminiKey, aiCfg.geminiModel, evalRules);
                }
                setVoiceFeedback(res);
                h.current.voiceAttempts.push({ word: f.front, spoken: res.spokenText, accuracy: res.accuracy, feedback: res.feedback });
                setIsAnalyzingAI(!1);
                if (isValidSpeechResult(res) && !o) revealAfterSpeech();
              } catch (err) {
                console.warn("Fallback to device recognition:", err);
                setIsAnalyzingAI(!1);
                runDeviceRecognition();
              }
            };
            reader.readAsDataURL(blob);
          } catch (e) {
            setIsAnalyzingAI(!1);
          }
        };
        recorder.start();
        recRef.current = recorder;
        return;
      } catch (err) {
        /* fall through */
      }
    }
    await runDeviceRecognition();
  }

  async function runDeviceRecognition() {
    setIsListening(!0);
    try {
      let res = await recognizeSpeechPt();
      setIsListening(!1);
      if (res.error && !res.transcript) {
        setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: speechErrorFeedback(res.error), quality: "precisa_praticar", isAI: !1 });
        return;
      }
      if (!String(res.transcript || "").trim()) {
        setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: speechErrorFeedback("no-speech"), quality: "precisa_praticar", isAI: !1 });
        return;
      }
      applySpeechResult(res.transcript);
    } catch (e) {
      setIsListening(!1);
      setVoiceFeedback({ spokenText: "", accuracy: 0, feedback: speechErrorFeedback("error"), quality: "precisa_praticar", isAI: !1 });
    }
  }

  function stopVoiceRecognition() {
    let plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SpeechRec;
    if (plugin && typeof plugin.stop === "function") {
      try { plugin.stop(); } catch (e) {}
    }
    if (recRef.current) {
      try { recRef.current.stop(); } catch (e) {}
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

    h.current.total += 1;

    let effectiveRating = t;

    if (isValidSpeechResult(voiceFeedback)) {
      let verdict = rateSpeechAndTime(voiceFeedback.accuracy, frontTimeSec, audiosPlayed, cardLimitSec, evalRules);
      effectiveRating = verdict.rating;
      if ("good" === verdict.rating) {
        h.current.correct += 1;
      } else if ("again" === verdict.rating) {
        h.current.wrong += 1;
        h.current.struggledList.push({
          word: f.front,
          reason: verdict.reason + (voiceFeedback.spokenText ? ' (falou "' + voiceFeedback.spokenText + '")' : ""),
          timeSec: verdict.timeSec,
          audioUsed: verdict.audioUsed
        });
      } else {
        h.current.correct += 1;
        h.current.struggledList.push({
          word: f.front,
          reason: verdict.reason + (voiceFeedback.spokenText ? ' (falou "' + voiceFeedback.spokenText + '")' : ""),
          timeSec: verdict.timeSec,
          audioUsed: verdict.audioUsed
        });
      }
    } else {
      let verdict = rateManualAndTime(t, frontTimeSec, audiosPlayed, cardLimitSec, evalRules);
      effectiveRating = verdict.rating;
      if ("good" === verdict.rating) {
        h.current.correct += 1;
      } else if ("again" === verdict.rating) {
        h.current.wrong += 1;
        h.current.struggledList.push({
          word: f.front,
          reason: verdict.reason,
          timeSec: verdict.timeSec,
          audioUsed: verdict.audioUsed
        });
      } else {
        h.current.correct += 1;
        h.current.struggledList.push({
          word: f.front,
          reason: verdict.reason,
          timeSec: verdict.timeSec,
          audioUsed: verdict.audioUsed
        });
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

  let speechVerdict = null;
  if (isValidSpeechResult(voiceFeedback) && f) {
    let flipMoment = h.current.flipTime || Date.now();
    let frontTimeSec = Math.max(0.5, (flipMoment - h.current.cardStartTime) / 1000);
    speechVerdict = rateSpeechAndTime(voiceFeedback.accuracy, frontTimeSec, h.current.audioPlaysCount, f.readingTime, evalRules);
  }

  return (0, u.jsxs)("div", {
    className: "max-w-md mx-auto px-4 flex flex-col justify-between kid-shell",
    children: [
      (0, u.jsxs)("div", {
        className: "w-full space-y-3",
        children: [
          (0, u.jsxs)("div", {
            className: "flex items-center justify-between",
            children: [
              (0, u.jsx)("button", {
                type: "button",
                onClick: a,
                className: "tap-xl px-3 font-body text-sm font-medium text-ink-soft hover:text-white transition-colors flex items-center",
                children: "← Sair"
              }),
              (0, u.jsxs)("p", {
                className: "font-body text-sm font-semibold text-white",
                children: [l + 1, " de ", d]
              })
            ]
          }),
          !isOnline() ? (0, u.jsx)("p", { className: "font-body text-xs text-amber", children: "Sem internet: a voz do aparelho entra no lugar da voz neural." }) : null,
          (0, u.jsx)("div", {
            className: "h-2 w-full rounded-full bg-base-line overflow-hidden",
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
          className: "flip-card",
          onClick: y,
          children: (0, u.jsxs)("div", {
            className: "flip-card-inner " + (o ? "is-flipped" : ""),
            children: [
              (0, u.jsxs)("div", {
                className: "flip-face",
                children: [
                  (0, u.jsxs)("div", {
                    className: "w-full flex items-center justify-between",
                    children: [
                      (0, u.jsx)("span", { className: "font-body text-sm font-semibold text-ink-soft", children: "Leia" }),
                      e.audioHintEnabled ? (0, u.jsxs)("button", {
                        type: "button",
                        onClick: handlePlayFrontAudio,
                        className: "speak-btn tap-xl",
                        title: "Ouvir a palavra",
                        "aria-label": "Ouvir a palavra",
                        children: [
                          (0, u.jsx)("span", { "aria-hidden": "true", children: "🔊" })
                        ]
                      }) : null
                    ]
                  }),
                  (0, u.jsx)("p", { className: "word-hero my-auto", children: f.front }),
                  (0, u.jsx)("p", { className: "font-body text-sm font-medium " + (flipHint ? "text-amber" : "text-violet-light"), children: flipHint || (mustSpeak ? "Fale a palavra para ver o outro lado" : "Toque na carta para virar") })
                ]
              }),
              (0, u.jsxs)("div", {
                className: "flip-face flip-face-back",
                children: [
                  (0, u.jsxs)("div", {
                    className: "w-full flex items-center justify-between",
                    children: [
                      (0, u.jsx)("span", { className: "font-body text-sm font-semibold text-violet-light", children: "Resposta" }),
                      (0, u.jsx)("button", {
                        type: "button",
                        onClick: ev => { ev.preventDefault(); ev.stopPropagation(); ec(f.backAudio, f.back); },
                        className: "speak-btn tap-xl",
                        title: "Ouvir resposta",
                        "aria-label": "Ouvir resposta",
                        children: "🔊"
                      })
                    ]
                  }),
                  (0, u.jsx)("p", { className: "meaning-hero my-auto", children: f.back || "—" }),
                  (0, u.jsx)("p", { className: "font-body text-sm font-medium text-ink-soft", children: "Como foi a leitura?" })
                ]
              })
            ]
          })
        })
      }),
      (0, u.jsxs)("div", {
        className: "w-full space-y-3 pt-2",
        children: [
          voiceFeedback ? (0, u.jsxs)("div", {
            className: "p-4 rounded-2xl border text-center font-body space-y-1 animate-in fade-in-0 " + (voiceFeedback.accuracy >= 80 ? "bg-teal-dim border-teal/40 text-teal" : voiceFeedback.accuracy >= 50 ? "bg-amber-dim border-amber/40 text-amber" : "bg-coral-dim border-coral/40 text-coral"),
            children: [
              (0, u.jsxs)("p", { className: "font-semibold text-base", children: [voiceFeedback.feedback, " (", voiceFeedback.accuracy, "%)"] }),
              voiceFeedback.spokenText ? (0, u.jsxs)("p", { className: "text-sm opacity-90", children: ['Você falou: "', voiceFeedback.spokenText, '"'] }) : null,
              speechVerdict ? (0, u.jsxs)("p", { className: "text-sm opacity-90", children: [speechVerdict.timeSec, "s para ler · volta em ", v[speechVerdict.rating] || (speechVerdict.rating === "again" ? "1m" : "depois")] }) : null
            ]
          }) : null,
          !o ? (0, u.jsxs)("div", {
            className: "space-y-3",
            children: [
              needMicInfo ? (0, u.jsxs)("div", {
                className: "p-4 rounded-2xl bg-base-raised border border-base-line space-y-3",
                children: [
                  (0, u.jsx)("p", { className: "font-body text-sm text-white", children: "Vamos ouvir você ler em voz alta. O som fica neste celular — só vai para a internet se os pais ligarem o Gemini." }),
                  (0, u.jsx)("button", {
                    type: "button",
                    onClick: () => { rememberMicExplained(); setNeedMicInfo(!1); startVoiceRecognition(); },
                    className: "study-action w-full rounded-2xl bg-violet text-white font-body text-lg font-semibold",
                    children: "Pode ouvir"
                  })
                ]
              }) : isListening ? (0, u.jsxs)("button", {
                type: "button",
                onClick: stopVoiceRecognition,
                className: "study-action w-full rounded-2xl bg-coral text-white font-body text-lg font-semibold animate-pulse flex items-center justify-center gap-2",
                children: [
                  (0, u.jsx)("span", { children: "⏹" }),
                  " Ouvindo… toque para parar"
                ]
              }) : isAnalyzingAI ? (0, u.jsxs)("div", {
                className: "study-action w-full rounded-2xl bg-violet-dim text-violet-light font-body text-base font-medium flex items-center justify-center gap-2 border border-violet/40",
                children: [
                  (0, u.jsx)("span", { className: "animate-spin", children: "✨" }),
                  " Avaliando a leitura..."
                ]
              }) : (0, u.jsxs)("button", {
                type: "button",
                onClick: startVoiceRecognition,
                className: "study-action w-full rounded-2xl bg-violet text-white font-body text-lg font-semibold flex items-center justify-center gap-2",
                children: [
                  (0, u.jsx)("span", { className: "text-2xl", children: "🎙️" }),
                  " Fale a palavra"
                ]
              }),
              e.skipRecordingEnabled && !mustSpeak ? (0, u.jsx)("button", {
                type: "button",
                onClick: y,
                className: "w-full font-body text-sm font-medium rounded-2xl bg-base-raised border border-base-line py-3 text-ink-soft",
                children: "Ver resposta sem gravar"
              }) : null
            ]
          }) : mustSpeak && isValidSpeechResult(voiceFeedback) ? (0, u.jsx)("button", {
            type: "button",
            onClick: () => b(speechVerdict ? speechVerdict.rating : "good"),
            className: "study-action w-full rounded-2xl bg-violet text-white font-body text-lg font-semibold flex items-center justify-center",
            children: "Continuar"
          }) : (0, u.jsxs)("div", {
            className: "flex gap-3 animate-in fade-in-0",
            children: [
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => b("again"),
                className: "study-action flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 bg-coral-dim border border-coral/30 text-coral",
                children: [
                  (0, u.jsx)("span", { className: "font-body text-lg font-semibold", children: "❌ Não sei" }),
                  (0, u.jsx)("span", { className: "font-body text-xs opacity-80", children: "de novo já" })
                ]
              }),
              (0, u.jsxs)("button", {
                type: "button",
                onClick: () => b("good"),
                className: "study-action flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 bg-teal-dim border border-teal/30 text-teal",
                children: [
                  (0, u.jsx)("span", { className: "font-body text-lg font-semibold", children: "✅ Acertei" }),
                  (0, u.jsx)("span", { className: "font-body text-xs opacity-80", children: v.good || "depois" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

