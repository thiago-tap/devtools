# DevTools Roadmap

Este roadmap organiza o DevToolbox como uma plataforma de ferramentas para desenvolvimento diário: rápida, privada quando possível, fácil de compartilhar e com uma base consistente para novas ferramentas.

## Fase 1 — Product Foundation

Objetivo: tornar a experiência mais coesa e preparar o catálogo para crescer.

- Definir um contrato comum para ferramentas:
  - entrada clara;
  - saída copiável ou descarregável;
  - `metadataForTool`;
  - indicação de privacidade: client-only, server/API ou AI-assisted;
  - testes mínimos para lógica pura.
- URLs compartilháveis:
  - `?input=...`;
  - `?mode=...`;
  - parâmetros específicos por ferramenta quando fizer sentido.
- Histórico local por ferramenta:
  - últimos inputs/outputs em `localStorage`;
  - limite pequeno por ferramenta;
  - botão para limpar histórico.
- Home personalizada:
  - favoritos/pinned no topo;
  - coleções por fluxo de trabalho.
- Busca melhorada:
  - aliases como `jwt`, `token`, `bearer`, `base64 decode`, `dns all`;
  - busca por nome, descrição, tags e aliases.
- Coleções iniciais:
  - Debug de API;
  - Frontend;
  - Segurança;
  - Imagens;
  - JSON/API.

**Status:** implementado. Melhorias contínuas: aplicar histórico/querystring em ferramentas de nicho restantes.

## Fase 2 — Ferramentas de Alto Valor

Objetivo: aumentar a utilidade para tarefas comuns de backend, frontend, segurança e APIs.

- JWT verify com secret/JWKS.
- JWK ↔ PEM converter.
- CSP builder/analyzer.
- robots.txt + sitemap validator.
- SSL/TLS checker.
- HTTP status explainer.
- JSON Schema validator.
- Zod ↔ TypeScript ↔ JSON Schema.
- OpenAPI mini-validator/viewer.
- UUID v7 / ULID / NanoID.
- Cron humanizer com próximos horários.

**Status:** implementado em versão utilizável. Melhorias futuras: validação completa de JSON Schema/OpenAPI por especificação e JWKS remoto automático.

## Fase 3 — Suite Network/API Debug

Objetivo: consolidar as ferramentas de rede em um pacote forte para depuração de APIs e domínios.

- DNS checker como base da suite (modo `Todos` já entregue).
- Headers checker.
- CORS probe.
- Redirect chain.
- Meta/Open Graph preview.
- SSL/TLS checker.
- Status checker.
- Latency/check endpoint.
- Webhook inspector/mock.

**Status:** implementado em versão utilizável, com status/latência, SSL, robots/sitemap e webhook mock.

## Fase 4 — SEO/PWA

Objetivo: melhorar descoberta, instalação e uso recorrente.

- Páginas por categoria.
- Conteúdo descritivo por ferramenta.
- Offline-first para ferramentas client-side.
- Manifest com mais shortcuts.
- Sitemap mais rico.
- Open Graph mais completo.

**Status:** implementado em versão inicial com categorias, coleções, sitemap enriquecido, Open Graph por ferramenta, manifest e service worker.

## Fase 5 — Qualidade e Manutenção

Objetivo: manter crescimento rápido sem perder consistência.

- `docs/ARCHITECTURE.md`.
- `docs/CONTRIBUTING.md`.
- Checklist para nova ferramenta.
- Separação documentada entre:
  - client-only;
  - server/API;
  - AI-assisted.
- Padrão de testes por tipo de ferramenta.
- Smoke tests representativos dos principais fluxos.

**Status:** implementado com docs, contrato de ferramenta e smoke cobrindo home, JSON, Datas, DNS e JSON Schema.

## Status Atual

Concluído ou em andamento recente:

- Ferramentas JSON, YAML, JWT, PEM, QR Code, Slug, Semver, JSONPath, Lorem/Faker.
- Imagem para dev com remoção de metadados e pack de favicons.
- Redirect chain, Meta/Open Graph e CORS probe.
- DNS checker com tipos individuais e modo `Todos`.
- Calculadora de Datas em formato brasileiro.
- CI com lint, type-check, testes, build e E2E smoke em `main`.
## Histórico anterior — DevToolbox e Estúdio de Estampas

Legenda: `[x]` feito · `[ ]` pendente

---

### Fase 0 — Documentação

| Status | Entrega |
|--------|---------|
| [x] | Pasta `docs/` |
| [x] | [easypanel-setup.md](./easypanel-setup.md) com porta destino **3000** |

---

### Fase 1 — Migração Easypanel

| Status | Tarefa |
|--------|--------|
| [x] | Dockerfile + Next `standalone` |
| [x] | Remover OpenNext / Wrangler |
| [x] | `lib/ai/client.ts` + OpenRouter |
| [x] | Deploy Easypanel + DNS Hostinger |
| [x] | Domínio `devtools.catiteo.com` (destino porta **3000**) |
| [x] | README atualizado |

---

### Fase 2 — Estúdio de Estampas (MVP)

| Status | Tarefa |
|--------|--------|
| [x] | Rota `/tools/estampas` + catálogo |
| [x] | UI: upload, presets, resize, cores, export |
| [x] | API `POST /api/images/process` (Sharp) |
| [x] | Resize com DPI / cm |
| [x] | Convert PNG/JPEG/WebP |
| [x] | Color knockout + remover pretos |
| [x] | Presets DTF e Camisa preta |
| [x] | Rate limit + `MAX_UPLOAD_MB` |
| [x] | Privacidade (upload de imagens) |
| [ ] | Testes manuais em produção após deploy |

**Critério de pronto:** upload → preset camisa preta ou DTF → download PNG.

---

### Fase 3 — Remover fundo

| Status | Tarefa |
|--------|--------|
| [x] | Rembg como serviço dedicado (Easypanel) |
| [x] | `REMBG_BASE_URL`, `GET /api/images/process` (status), ações `remove_bg`, presets transparentes |
| [x] | Rate limit dedicado (`REMBG_RATE_LIMIT_PER_MIN`) |

---

### Fase 4 — Halftone

| Status | Tarefa |
|--------|--------|
| [x] | Motor halftone (Sharp + Bayer 4×4 / Floyd–Steinberg) |
| [x] | Preset Silk |

---

### Fase 5 — Vetorização

| Status | Tarefa |
|--------|--------|
| [x] | potrace no container (`Dockerfile`) |
| [x] | Export SVG (`action: vectorize`) |

---

### Fase 6 — Pipeline e polish

| Status | Tarefa |
|--------|--------|
| [x] | Pipeline na mesma rota (`action: pipeline` + JSON) |
| [x] | Lote e receitas em `localStorage` (UI Estampas) |

Ver [estudio-estampas.md](./estudio-estampas.md).
