# Limitações da arquitetura Cloudflare (contexto para migração)

Este documento registra **por que** certas funcionalidades não são adequadas no setup atual e **o que já tivemos que contornar**.

## Runtime: Workers vs Node completo

O deploy usa **OpenNext para Cloudflare**: as API Routes e o SSR rodam no **Workers** com `nodejs_compat`, não em um processo Node tradicional com acesso irrestrito a:

- Binários nativos (`pngquant`, `ffmpeg`, `potrace`)
- `sharp` (libvips compilado por SO)
- Subprocessos CLI
- Sistema de arquivos persistente para uploads grandes
- Jobs longos (CPU/time limits do Worker)

## Caso real: ferramenta YAML (erro 500)

**Problema:** `import { parse, stringify } from "yaml"` no topo de `lib/tools/yaml-json.ts` quebrava `/tools/yaml` em produção com **500 Internal Server Error**.

**Solução aplicada:**

1. Import dinâmico: `await import("yaml")` só na conversão
2. Página com `"use client"` + `dynamic(..., { ssr: false })` em `app/tools/yaml/`

**Lição:** pacotes que assumem Node completo ou bundling pesado no servidor tendem a falhar no edge.

## Bibliotecas de imagem discutidas

| Biblioteca | Uso típico | Viável no Worker atual? |
|------------|------------|-------------------------|
| **sharp** | Resize, formatos, compressão | Não |
| **imagemin** (+ plugins pngquant/mozjpeg) | Otimização | Não (plugins nativos) |
| **pngquant** | CLI quantização PNG | Não |
| **rembg** | Remover fundo (Python/ONNX) | Não |
| **potrace / vtracer** | Vetorização | Não (CLI / CPU) |
| **@squoosh/lib** | WASM no browser | Sim (cliente), com bundle grande |
| **@imgly/background-removal** | Fundo no browser | Sim, pesado e lento no mobile |

## O que continua funcionando bem no Cloudflare

- Ferramentas **100% client-side** (hash, JSON, regex, cores, etc.)
- APIs leves: DNS (DoH), headers (fetch), rate limit
- Workers AI para texto curto (explain, review, convert)
- CDN global e custo baixo

## Decisão de produto

Para um **sistema completo de imagens e estampas** (fundo, knockout de cor, halftone, vetor, lotes, DPI de impressão), a direção acordada é **migrar para Easypanel** (Node/Docker) e implementar o processamento no servidor.

Ver [migracao-easypanel.md](./migracao-easypanel.md).
