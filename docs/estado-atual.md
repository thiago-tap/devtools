# Estado atual do DevToolbox

## Visão geral

O **DevToolbox** é uma caixa de ferramentas web gratuita para desenvolvedores. A maior parte do processamento ocorre **no navegador** (privacidade, sem upload). Recursos que precisam de rede ou IA usam **API Routes** executadas no **Cloudflare Workers** via OpenNext.

| Item | Valor |
|------|--------|
| URL produção | https://devtools.catiteo.com |
| Branch principal | `main` |
| Versão package | `1.0.0` |

---

## Stack tecnológica

```
Frontend     Next.js 15 (App Router) + React 19 + TypeScript
Estilo       Tailwind CSS + componentes UI (shadcn-style)
Hospedagem   Cloudflare Pages
Runtime API  Cloudflare Workers (OpenNext)
IA           Cloudflare Workers AI — @cf/meta/llama-3-8b-instruct
Build deploy opennextjs-cloudflare + scripts/bundle-worker.js
Testes       Vitest (lib/tools)
```

### Scripts principais

| Comando | Função |
|---------|--------|
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Build Next.js padrão |
| `npm run pages:build` | Build OpenNext para Cloudflare |
| `npm run deploy` | Deploy Cloudflare Pages |
| `npm test` | Vitest |

### Arquivos de infraestrutura (Cloudflare)

| Arquivo | Função |
|---------|--------|
| `wrangler.toml` | Nome do projeto, binding `[ai]`, vars públicas |
| `open-next.config.ts` | Config OpenNext Cloudflare |
| `scripts/bundle-worker.js` | Bundle do `_worker.js` com polyfill `require` |
| `next.config.js` | `images.unoptimized`, ignore TS/eslint no build |

---

## Ferramentas disponíveis (21)

Catálogo central: `lib/tools.ts`. Cada ferramenta tem rota em `app/tools/<id>/` com `page.tsx` e `layout.tsx` (SEO).

### Por categoria

| ID | Nome | Rota | Client-side | IA |
|----|------|------|-------------|-----|
| json | Formatador JSON | `/tools/json` | Sim | Sim (explain) |
| yaml | YAML ↔ JSON | `/tools/yaml` | Sim* | Não |
| regex | Testador Regex | `/tools/regex` | Sim | Sim |
| diff | Comparador de Texto | `/tools/diff` | Sim | Não |
| markdown | Preview Markdown | `/tools/markdown` | Sim | Não |
| base64 | Base64 / URL / HTML | `/tools/base64` | Sim | Não |
| jwt | Decodificador JWT | `/tools/jwt` | Sim | Não |
| secrets | Gerador de Secrets | `/tools/secrets` | Sim | Não |
| hash | Gerador de Hash | `/tools/hash` | Sim | Não |
| password | Gerador de Senha | `/tools/password` | Sim | Não |
| colors | Conversor de Cores | `/tools/colors` | Sim | Não |
| code-review | Revisão de Código IA | `/tools/code-review` | Não | Sim |
| sql | Formatador SQL | `/tools/sql` | Sim | Sim |
| env | Formatador .env | `/tools/env` | Sim | Não |
| base-converter | Conversor de bases | `/tools/base-converter` | Sim | Não |
| cron | Interpretador Cron | `/tools/cron` | Sim | Não |
| timestamp | Conversor Timestamp | `/tools/timestamp` | Sim | Não |
| mime | MIME Types | `/tools/mime` | Sim | Não |
| uuid | Gerador UUID | `/tools/uuid` | Sim | Não |
| dns | DNS Check | `/tools/dns` | Não | Não |
| headers | HTTP Headers | `/tools/headers` | Não | Não |

\* **YAML:** import dinâmico do pacote `yaml` + `ssr: false` para evitar erro 500 no Worker (ver [limitacoes-cloudflare.md](./limitacoes-cloudflare.md)).

### Destaques por ferramenta

**Hash** (`lib/tools/hash.ts`): MD5, SHA-1/256/384/512, SHA3-256/512, BLAKE2b, HMAC-SHA256/384/512; upload de arquivo; comparação de hashes (`@noble/hashes`).

**Secrets** (`lib/tools/secrets.ts`): equivalente a `openssl rand` (base64/hex, presets de tamanho).

**Hash / Secrets / YAML / env / base-converter:** testes Vitest em `lib/tools/*.test.ts`.

---

## APIs server-side

| Rota | Método | Função | Dependência Cloudflare |
|------|--------|--------|------------------------|
| `/api/ai/explain` | POST | Explica JSON, regex, SQL | Workers AI binding `AI` |
| `/api/ai/convert` | POST | Converte código entre linguagens | Workers AI |
| `/api/ai/review` | POST | Revisão de código | Workers AI |
| `/api/dns` | GET | Consulta DNS (DoH) | Não (usa cloudflare-dns.com) |
| `/api/headers` | GET | Inspeciona headers HTTP | Não |

### Segurança das APIs (`lib/api/security.ts`)

- Rate limit por IP
- Limite de tamanho do body JSON
- DNS: bloqueio de IPs privados / SSRF
- Headers: validação de URL

---

## Estrutura de pastas (resumo)

```
app/
  page.tsx              # Home com busca e favoritos
  privacidade/          # Política de privacidade
  api/                  # Rotas server (edge)
  tools/*/              # Uma pasta por ferramenta
components/
  layout/               # ToolLayout, sidebar, shell
  home/                 # tools-explorer (busca + favoritos)
  tools/                # CopyButton, etc.
lib/
  tools.ts              # Catálogo de ferramentas
  tools/                # Lógica pura (hash, yaml, secrets, …)
  api/security.ts       # Guards das APIs
  hooks/                # use-favorites, use-debounced-value
  seo.ts                # Metadados
public/
  manifest.json         # PWA
  icon.svg
```

---

## UX e SEO

- **Home:** busca por nome/tags, favoritos em `localStorage` (`lib/hooks/use-favorites.ts`)
- **SEO:** `layout.tsx` por ferramenta + `lib/seo.ts`
- **PWA:** `public/manifest.json`
- **Privacidade:** página `/privacidade` descreve uso de Workers AI e APIs de rede

---

## O que ainda não existe

- Módulo de **imagens** (compressão, fundo, vetor, halftone)
- **Estúdio de estampas** para camisetas
- Processamento com **Sharp**, **rembg**, **potrace/vtracer**
- Deploy em **Easypanel** / Node completo
- Substituição planejada do Workers AI por provedor configurável no VPS

Ver [estudio-estampas.md](./estudio-estampas.md) e [roadmap.md](./roadmap.md).
