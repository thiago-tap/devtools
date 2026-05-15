# Estado atual do DevToolbox

## Visão geral

O **DevToolbox** é uma caixa de ferramentas web gratuita para desenvolvedores. A maior parte do processamento ocorre **no navegador** (privacidade, sem upload). Recursos que precisam de rede, IA ou processamento de imagem usam **API Routes** no servidor **Node.js** (Easypanel / Docker).

| Item | Valor |
|------|--------|
| URL produção | https://devtools.catiteo.com |
| Branch principal | `main` |
| Versão package | `1.0.1` |
| Hospedagem | Easypanel / Docker (Node 20) |

---

## Stack tecnológica

```
Frontend     Next.js 15 (App Router) + React 19 + TypeScript
Estilo       Tailwind CSS + componentes UI (shadcn-style)
Hospedagem   Easypanel / Docker (Node 20)
Runtime API  Next.js Route Handlers (Node)
IA           lib/ai/client.ts — OpenAI-compatible / OpenRouter / Ollama
Imagens      Sharp + Rembg opcional (lib/images) — Estúdio de Estampas
Build deploy Dockerfile (output: standalone)
Testes       Vitest (lib/tools, lib/images)
```

### Scripts principais

| Comando | Função |
|---------|--------|
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Build Next.js (standalone) |
| `npm run start` | Servidor de produção |
| `npm test` | Vitest |
| `docker compose up --build` | Stack local: **app** + **rembg** |
| `docker compose --profile monitoring up --build` | Acrescenta **uptime-kuma** (porta 3001) |

### Arquivos de infraestrutura

| Arquivo | Função |
|---------|--------|
| `Dockerfile` | Imagem de produção (standalone) |
| `docker-compose.yml` | Stack local: app + rembg; perfil `monitoring` → Uptime Kuma |
| `.env.example` | Variáveis (IA, URL pública, `MAX_UPLOAD_MB`) |
| `next.config.js` | `output: standalone`, images unoptimized |
| `docs/legacy/cloudflare-wrangler.toml` | Referência do deploy Cloudflare anterior |

---

## Ferramentas disponíveis (22)

Catálogo central: `lib/tools.ts`. Cada ferramenta tem rota em `app/tools/<id>/` com `page.tsx` e `layout.tsx` (SEO).

### Por categoria

| ID | Nome | Rota | Client-side | Servidor |
|----|------|------|-------------|----------|
| json | Formatador JSON | `/tools/json` | Sim | IA (explain) |
| yaml | YAML ↔ JSON | `/tools/yaml` | Sim* | — |
| regex | Testador Regex | `/tools/regex` | Sim | IA |
| diff | Comparador de Texto | `/tools/diff` | Sim | — |
| markdown | Preview Markdown | `/tools/markdown` | Sim | — |
| base64 | Base64 / URL / HTML | `/tools/base64` | Sim | — |
| jwt | Decodificador JWT | `/tools/jwt` | Sim | — |
| secrets | Gerador de Secrets | `/tools/secrets` | Sim | — |
| hash | Gerador de Hash | `/tools/hash` | Sim | — |
| password | Gerador de Senha | `/tools/password` | Sim | — |
| colors | Conversor de Cores | `/tools/colors` | Sim | — |
| code-review | Revisão de Código IA | `/tools/code-review` | Não | IA |
| sql | Formatador SQL | `/tools/sql` | Sim | IA |
| env | Formatador .env | `/tools/env` | Sim | — |
| base-converter | Conversor de bases | `/tools/base-converter` | Sim | — |
| cron | Interpretador Cron | `/tools/cron` | Sim | — |
| timestamp | Conversor Timestamp | `/tools/timestamp` | Sim | — |
| mime | MIME Types | `/tools/mime` | Sim | — |
| uuid | Gerador UUID | `/tools/uuid` | Sim | — |
| dns | DNS Check | `/tools/dns` | Não | API |
| headers | HTTP Headers | `/tools/headers` | Não | API |
| **estampas** | **Estúdio de Estampas** | `/tools/estampas` | Não | **Sharp**, **Rembg** (env) |

\* **YAML:** import dinâmico do pacote `yaml` + `ssr: false`.

### Estúdio de Estampas (MVP + fundo)

- **UI:** `/tools/estampas` — upload, presets, redimensionar, cores, exportar, **Remover fundo**
- **API:** `POST /api/images/process` — `metadata`, `resize`, `convert`, `knockout`, `knockout_dark`, `preset_dtf`, `preset_camisa_preta`, `remove_bg`, `preset_dtf_transparent`, `preset_camisa_preta_transparent`
- **Limite:** `MAX_UPLOAD_MB`, rate limit geral + extra por IP para ações Rembg (`REMBG_RATE_LIMIT_PER_MIN`)

Ver [estudio-estampas.md](./estudio-estampas.md) e [roadmap.md](./roadmap.md).

---

## APIs server-side

| Rota | Método | Função |
|------|--------|--------|
| `/api/ai/explain` | POST | Explica JSON, regex, SQL |
| `/api/ai/convert` | POST | Converte código entre linguagens |
| `/api/ai/review` | POST | Revisão de código |
| `/api/dns` | GET | Consulta DNS (DoH) |
| `/api/headers` | GET | Inspeciona headers HTTP |
| `/api/images/process` | GET | `{ rembg }` — Rembg configurado? |
| `/api/images/process` | POST | Imagens: Sharp + Rembg (ações pesadas) |

### Segurança (`lib/api/security.ts`, `lib/api/image-upload.ts`)

- Rate limit por IP (JSON e multipart)
- Limite de tamanho do body / upload
- DNS: bloqueio de IPs privados / SSRF
- Imagens: MIME permitidos (PNG, JPEG, WebP, GIF); operações Rembg com teto próprio por minuto

---

## Estrutura de pastas (resumo)

```
app/
  page.tsx              # Home com busca e favoritos
  privacidade/          # Política de privacidade
  api/                  # Rotas server (Node)
    ai/                 # explain, convert, review
    images/process/     # Estúdio de Estampas
  tools/*/              # Uma pasta por ferramenta
components/
  layout/               # ToolLayout, sidebar, shell
  home/                 # tools-explorer
lib/
  tools.ts              # Catálogo
  tools/                # Lógica client-side
  images/               # Sharp: process, color, rembg client, constants
  api/                  # security, image-upload
  ai/client.ts          # OpenAI-compatible
```

---

## Próximas fases (não implementadas)

- Halftone para silk screen
- Vetorização (vtracer / potrace)
- Pipeline em lote

Ver [roadmap.md](./roadmap.md).
