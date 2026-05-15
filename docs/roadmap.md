# Roadmap — DevToolbox e Estúdio de Estampas

Cronograma acordado: **documentar → migrar Easypanel → construir módulo de imagens/estampas**.

Legenda: `[x]` feito · `[ ]` pendente · `[~]` em andamento

---

## Fase 0 — Documentação

| Status | Entrega |
|--------|---------|
| [x] | Pasta `docs/` com estado atual, limitações Cloudflare, estúdio de estampas, migração, roadmap |
| [x] | Link no README principal para `docs/` |

---

## Fase 1 — Migração Easypanel

**Meta:** mesmo site em produção, sem regressões, com Node completo.

| Status | Tarefa |
|--------|--------|
| [x] | Dockerfile + Next `standalone` |
| [x] | Remover OpenNext, wrangler, bundle-worker |
| [x] | `lib/ai/client.ts` + refactor `/api/ai/*` |
| [ ] | Deploy Easypanel + env vars |
| [ ] | Testes: 21 ferramentas + APIs DNS/headers/IA |
| [ ] | Cutover DNS `devtools.catiteo.com` |
| [x] | Atualizar README (deploy Easypanel) |

**Critério de pronto:** produção estável 48h; `npm test` verde; IA funcionando ou desabilitada com mensagem clara.

---

## Fase 2 — Estúdio de Estampas (MVP)

**Meta:** fluxo útil para DTF e camisa preta sem halftone/vetor ainda.

| Status | Tarefa |
|--------|--------|
| [ ] | Rota `/tools/estampas` + entrada no `lib/tools.ts` |
| [ ] | UI: upload, preview, painel de parâmetros |
| [ ] | API `POST /api/images/resize` (Sharp, DPI) |
| [ ] | API `POST /api/images/convert` (PNG/JPEG/WebP) |
| [ ] | API `POST /api/images/color-knockout` (cor + tolerância → alpha) |
| [ ] | Preset **Camisa preta** (fundo + knockout preto quando Fase 3 pronta) |
| [ ] | Preset **DTF** (PNG 300 DPI transparente) |
| [ ] | Temp files + limpeza TTL |
| [ ] | Rate limit e `MAX_UPLOAD_MB` |
| [ ] | Texto de privacidade para upload de imagens |

**Critério de pronto:** usuário envia arte, redimensiona, remove cor preta, baixa PNG para impressão.

---

## Fase 3 — Remover fundo

| Status | Tarefa |
|--------|--------|
| [ ] | Sidecar Python `rembg` ou equivalente Node |
| [ ] | API `POST /api/images/remove-background` |
| [ ] | Integrar ao preset Camisa preta e DTF |
| [ ] | Preview antes/depois |

---

## Fase 4 — Halftone

| Status | Tarefa |
|--------|--------|
| [ ] | ImageMagick ou motor halftone em Node |
| [ ] | API `POST /api/images/halftone` |
| [ ] | UI: LPI, ângulo, contraste, zoom preview |
| [ ] | Preset **Silk 1 cor** |

---

## Fase 5 — Vetorização

| Status | Tarefa |
|--------|--------|
| [ ] | CLI `vtracer` ou `potrace` no container |
| [ ] | API `POST /api/images/vectorize` |
| [ ] | Limite de cores, avisos UX para fotos |
| [ ] | Preset **Vinil** |
| [ ] | Download SVG |

---

## Fase 6 — Pipeline e polish

| Status | Tarefa |
|--------|--------|
| [ ] | `POST /api/images/pipeline` (JSON com preset + parâmetros) |
| [ ] | Processamento em lote (várias imagens) |
| [ ] | Salvar “receita” no browser (localStorage) |
| [ ] | Mockup camiseta (opcional) |
| [ ] | PDF tamanho real para gráfica (opcional) |
| [ ] | Testes E2E upload → export |

---

## Backlog (ideias, sem prioridade)

- Comparação TinyPNG-like só no browser (WASM) para quem não quer upload
- Separação de cores para silk (canal por cor)
- Integração com IA para sugerir knockout/tolerância
- Conta/usuário e histórico na nuvem (fora do escopo atual)

---

## Decisões registradas

| Data | Decisão |
|------|---------|
| 2026-05 | Manter DevToolbox; adicionar Estúdio de Estampas como módulo principal pós-migração |
| 2026-05 | Cloudflare inadequado para Sharp/rembg/halftone; migrar para Easypanel |
| 2026-05 | YAML corrigido com import dinâmico + `ssr: false` (permanece válido até migração) |

---

## Métricas de sucesso (Estúdio)

- Reduzir tempo de preparo de arte para camisa preta (fundo + knockout) para **&lt; 2 min** por arquivo
- Export PNG 300 DPI sem erro em arquivos até **25 MB**
- Uptime do VPS Easypanel alinhado ao uso pessoal/comercial do produto

Ver detalhes funcionais em [estudio-estampas.md](./estudio-estampas.md).
