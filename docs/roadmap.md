# Roadmap — DevToolbox e Estúdio de Estampas

Legenda: `[x]` feito · `[ ]` pendente

---

## Fase 0 — Documentação

| Status | Entrega |
|--------|---------|
| [x] | Pasta `docs/` |
| [x] | [easypanel-setup.md](./easypanel-setup.md) com porta destino **3000** |

---

## Fase 1 — Migração Easypanel

| Status | Tarefa |
|--------|--------|
| [x] | Dockerfile + Next `standalone` |
| [x] | Remover OpenNext / Wrangler |
| [x] | `lib/ai/client.ts` + OpenRouter |
| [x] | Deploy Easypanel + DNS Hostinger |
| [x] | Domínio `devtools.catiteo.com` (destino porta **3000**) |
| [x] | README atualizado |

---

## Fase 2 — Estúdio de Estampas (MVP)

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

## Fase 3 — Remover fundo

| Status | Tarefa |
|--------|--------|
| [x] | Rembg como serviço dedicado (Easypanel) |
| [x] | `REMBG_BASE_URL`, `GET /api/images/process` (status), ações `remove_bg`, presets transparentes |
| [x] | Rate limit dedicado (`REMBG_RATE_LIMIT_PER_MIN`) |

---

## Fase 4 — Halftone

| Status | Tarefa |
|--------|--------|
| [x] | Motor halftone (Sharp + Bayer 4×4 / Floyd–Steinberg) |
| [x] | Preset Silk |

---

## Fase 5 — Vetorização

| Status | Tarefa |
|--------|--------|
| [x] | potrace no container (`Dockerfile`) |
| [x] | Export SVG (`action: vectorize`) |

---

## Fase 6 — Pipeline e polish

| Status | Tarefa |
|--------|--------|
| [x] | Pipeline na mesma rota (`action: pipeline` + JSON) |
| [x] | Lote e receitas em `localStorage` (UI Estampas) |

Ver [estudio-estampas.md](./estudio-estampas.md).
