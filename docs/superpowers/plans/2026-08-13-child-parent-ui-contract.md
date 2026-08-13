# Sprint 1 — Contrato criança / responsável

Plano executável da análise de UI/UX. Sem redesenho de identidade. Só o contrato de cada superfície.

## Objetivo

A criança vê leitura. O responsável vê gestão e diagnóstico. As duas peles deixam de vazar uma na outra.

## Fora de escopo

- Tema claro da criança (sprint 2)
- Destaque de sílabas
- Relatório como carta da semana (sprint 3)
- Troca de `prompt()` / nova criança
- Remover Google Fonts do `app.js`

## Tarefas

### 1. Baralho no modo criança
- Sem verso, sem áudio do verso, sem estado FSRS (`novo` / `aprendendo` / `maduro`)
- Preview, se existir, mostra só a palavra + ouvir a palavra
- Copy: "palavras", não "fichas cadastradas"

### 2. Empty state do responsável
- Com gestão aberta e zero baralhos: CTA "Novo baralho" e "Restaurar backup"
- Nunca "Entrar na Área dos Pais" enquanto `isParentMode`

### 3. Fim de sessão da criança
- Celebração + quantas palavras leu + voltar
- Sem lista de hesitação, sem "falou X", sem ritmo/tempo como boletim
- O registro completo continua a gravar no histórico dos pais

### 4. Layout
- Tile do baralho não estica (`align-items: start`)
- Header do responsável: ação primária "+ Novo baralho" + menu "Mais" (Relatório, Backup, Sair)
- Botões do header com mínimo 48×48

### 5. Acessibilidade mínima
- Contraste de `em dia` / `Abrir` / labels 10px no fluxo visível
- Toggles do baralho com `aria-label` e `aria-pressed`
- Face de trás da carta `aria-hidden` até virar
- Consentimento do microfone só ao tocar em "Fale a palavra", uma vez por sessão
- Botões da criança sem intervalo FSRS (`10m`)

## Verificação

- `npm test` (inclui novos asserts de contrato em `scripts/test-ui-cards.mjs`)
- `npm run build`
- Exercitar no browser: home criança, home pai vazia, detalhe, estudo, fim de sessão
