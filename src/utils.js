function normalizeStr(e) {
  return (e || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
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
  let a = n.split(/\s+/).filter(Boolean),
    l = r.split(/\s+/).filter(Boolean);
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
  let cleanJson = text.replaceAll("```json", "").replaceAll("```", "").trim();
  let parsed = JSON.parse(cleanJson);
  return {
    spokenText: parsed.spokenText || "",
    accuracy: Number(parsed.accuracyScore) || 0,
    feedback: parsed.feedback || "",
    quality: parsed.quality || (parsed.accuracyScore >= 80 ? "excelente" : parsed.accuracyScore >= 50 ? "quase_la" : "precisa_praticar"),
    isAI: !0
  };
}

