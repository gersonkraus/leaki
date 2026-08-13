# Leaki — Capacitor 8 (Android)

App de **repetição espaçada** (FSRS) empacotado com [Capacitor 8](https://capacitorjs.com/) a partir do artifact `leaki.html`.

| | |
|---|---|
| **App ID** | `app.leaki.srs` |
| **Nome** | Leaki |
| **Capacitor** | 8.5 |
| **Web assets** | `www/` (build a partir de `leaki.html`) |
| **Plataforma** | Android (`android/`) |

## Pré-requisitos (já instalados nesta máquina)

| Componente | Local |
|------------|--------|
| OpenJDK 21 | `/usr/lib/jvm/java-21-openjdk-amd64` |
| Android SDK | `~/Android/Sdk` (platforms 35/36, build-tools) |
| Android Studio | `/opt/android-studio` → `studio.sh` |
| Env vars | bloco em `~/.bashrc` (`JAVA_HOME`, `ANDROID_HOME`, `CAPACITOR_ANDROID_STUDIO_PATH`) |

Em terminal novo: `source ~/.bashrc` (ou abra outro terminal).

## Comandos

```bash
npm install

# Abrir no computador (e API de sync em /sync/:chave)
npm run web
# → http://127.0.0.1:3030

# Túnel Cloudflare (URL fixa https://leaki.gerson.com)
# cp cloudflared.yml.example cloudflared.yml  → preencha o UUID
npm run tunnel

# Prepara HTML + fontes locais e sincroniza no Android
npm run sync

# Gerar APK debug (sem abrir IDE)
npm run build:apk
# → android/app/build/outputs/apk/debug/app-debug.apk

# Abrir no Android Studio
npm run open:android

# Atalho: sync + open
npm run android

# Regenerar ícone e splash a partir de assets/
npm run assets
```

No Android Studio: **Run ▶** (emulador ou device USB).  
Instalar APK debug no celular: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

## Fluxo de desenvolvimento

1. Edite `leaki.html` (fonte do artifact).
2. `npm run sync` — gera `www/index.html` (fontes offline) e copia para o app nativo.
3. Rebuild/reinstale no device.

## Fontes offline

As famílias **IBM Plex Sans**, **IBM Plex Mono** e **Space Grotesk** (latin / latin-ext) estão em:

- `www/fonts.css`
- `www/fonts/*.woff2`

O script `scripts/prepare-web.mjs` troca o carregamento do Google Fonts por esses arquivos. O app não precisa de rede para tipografia.

## Persistência (baralhos, fichas, histórico e IA)

O artifact original usa `window.storage` (API Claude Artifact). No Android isso não existe.

- Polyfill: `www/storage-polyfill.js`
- Backend: **IndexedDB** (suporta áudio em data-URL); fallback **localStorage**
- Chaves: `anki-crud:decks`, `anki-crud:cards`, `anki-crud:history`, `anki-crud:ai-settings`
- Injetado automaticamente por `prepare:web` **antes** do bundle React

## Permissões Android

Em `android/app/src/main/AndroidManifest.xml`:

- `INTERNET` (acesso a rede e APIs de IA)
- `RECORD_AUDIO` / `MODIFY_AUDIO_SETTINGS` — gravação via microfone e análise de voz

---

## 🎙️ Avaliação de Leitura por Voz (IA & Reconhecimento Nativo)

Recurso interativo para alfabetização e treino de leitura:

- **Botão `🎙️ Ler em voz alta para a IA avaliar`**:
  - A criança lê a palavra ou frase em voz alta diretamente para o microfone.
  - O app analisa a fonética e pronúncia em tempo real.
- **Dois Motores Suportados**:
  1. **Nativo (Web Speech API em `pt-BR`)**: Instantâneo, 100% gratuito e funciona offline no Android e Chrome com algoritmo de distância de Levenshtein por fonemas e palavras.
  2. **Google Gemini LLM (Gemini 1.5 Flash)**: Avaliação pedagógica aprofundada configurável via chave de API do Google AI Studio.
- **Ponderação Automática no FSRS**:
  - **$\ge 80\%$ (Excelente)**: Classifica como `good`, expandindo os intervalos de estudo.
  - **$50\% - 79\%$ (Dificuldade/Troca de Letra)**: Classifica como `hard` (rever em `5m` ou `1d`), aumentando a dificuldade $D$.
  - **$< 50\%$ (Incorreto)**: Classifica como `again` (rever em `1m`).

---

## 🧒 Modo de Estudo Acessível (Crianças & Dificuldade de Leitura)

- **Leitura com Esforço Visual Próprio**:
  - O texto da palavra aparece em destaque grande. O áudio **não toca sozinho na frente** para incentivar a leitura visual independente.
  - Botão **`🔊 Ajuda`**: Se a criança tocar mesmo que 1 única vez, o sistema identifica falta de autonomia de leitura e ajusta o agendamento para `hard`.
- **Tempo Limite de Leitura por Ficha (`readingTime`)**:
  - No cadastro da ficha, defina o tempo esperado (`5s` palavra curta, `8s` palavra longa, `15s+` frase curta).
  - Se a criança demorar mais que o tempo configurado, o app registra hesitação.
- **2 Botões Anti-Burla**:
  - ❌ **Não Lembrei**: Repete em 1 minuto (`1m`).
  - ✅ **Acertei!**: Ajusta conforme fluência, hesitação ou análise de voz.

---

## 📊 Painel dos Pais & Relatório de Estudos

Acessível pelo botão **📊 Relatório** no topo da tela inicial:

- **Estatísticas Consolidadas**: Tempo total dedicado, precisão geral (%) e total de sessões.
- **Diagnóstico de Voz**: Lista exata de palavras lidas por voz (`Esperado` vs `O que o filho falou` com % de precisão).
- **Palavras com Hesitação**: Rastreamento de dúvidas, áudios ouvidos e tempos de leitura.
- **Aba de Configuração de IA**: Permite alternar o provedor de voz e inserir chave de API.

---

## 💾 Backup e Restauração

- **Exportação completa**: Inclui baralhos, fichas, gravações de áudio, histórico de relatórios e configurações de IA em arquivo `.json`.
- **Importação inteligente**: Modos *Mesclar dados* ou *Substituir tudo*.
