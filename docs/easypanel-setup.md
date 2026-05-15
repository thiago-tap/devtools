# Configurar DevToolbox no Easypanel

Guia para o projeto **sistemasdev** (ou qualquer projeto Easypanel vazio).

> **Deploy:** com **Auto Deploy** ligado no GitHub, qualquer push na branch `main` dispara novo build no Easypanel.

## Pré-requisitos

- Repositório: `https://github.com/thiago-tap/devtools` (branch `main`)
- Domínio: `devtools.catiteo.com`
- Chave OpenRouter (nova, se a anterior foi exposta): https://openrouter.ai/keys

---

## Passo 1 — Criar o serviço

1. No projeto Easypanel, clique em **+ Serviço**
2. Escolha **App**
3. Nome sugerido: `devtools` (ou `developer-toolbox`)

---

## Passo 2 — Fonte (GitHub)

1. **Source** → **GitHub**
2. Se pedir, **conecte a conta GitHub** e autorize o Easypanel
3. Repositório: **`thiago-tap/devtools`**
4. Branch: **`main`**
5. Ative **Auto Deploy** (deploy automático a cada push)

---

## Passo 3 — Build (Docker)

| Campo | Valor |
|-------|--------|
| Método de build | **Dockerfile** |
| Caminho do Dockerfile | `/` (raiz) |
| Contexto | `.` (raiz do repo) |

Não use Nixpacks/Heroku build — o repo já tem `Dockerfile` otimizado para Next.js standalone.

O primeiro build pode levar **3–8 minutos** (`npm ci` + `next build`).

---

## Passo 4 — Rede (porta)

| Campo | Valor |
|-------|--------|
| Porta interna do container | **3000** |
| Protocolo | HTTP |

O `Dockerfile` expõe `PORT=3000` e `HOSTNAME=0.0.0.0`.

---

## Passo 5 — Variáveis de ambiente

Na aba **Environment** do serviço, adicione:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_APP_URL=https://devtools.catiteo.com
NEXT_PUBLIC_APP_NAME=DevToolbox

OPENAI_API_KEY=<sua-chave-openrouter>
OPENAI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=meta-llama/llama-3.1-8b-instruct
```

**Importante:** `NEXT_PUBLIC_*` são embutidas no build. Se mudar a URL depois, faça **Rebuild** do serviço.

---

## Passo 6 — Domínio

1. Aba **Domains** (ou **Domínios**)
2. Adicione: `devtools.catiteo.com`
3. O Easypanel mostra o destino DNS (CNAME ou IP)

### DNS (Cloudflare ou outro)

**Opção A — CNAME (comum no Easypanel)**

| Tipo | Nome | Destino |
|------|------|---------|
| CNAME | `devtools` | hostname indicado pelo Easypanel |

**Opção B — Proxy Cloudflare**

- Pode deixar proxy laranja **ativado**
- SSL/TLS: **Full** ou **Full (strict)**

Remova ou pause o CNAME antigo para `*.pages.dev` (Cloudflare Pages) quando o Easypanel estiver OK.

---

## Passo 7 — Deploy

1. Clique em **Deploy** / **Save & Deploy**
2. Acompanhe os **Logs** do build
3. Sucesso: container `Running`, health na porta 3000

URL temporária do Easypanel (ex.: `https://devtools.sistemasdev.easypanel.host`) — teste antes de trocar o DNS.

---

## Passo 8 — Validar

| Teste | URL / ação |
|-------|------------|
| Home | `/` — lista de ferramentas |
| YAML | `/tools/yaml` — sem erro 500 |
| Hash | `/tools/hash` |
| IA | `/tools/json` → explicar com IA |
| DNS | `/tools/dns` → `google.com` |

Se IA retornar 503: confira `OPENAI_API_KEY` e logs do container.

---

## Troubleshooting

### Build falha por memória

- Aumente RAM do VPS ou limite paralelismo
- O stage `npm run build` do Next.js é o mais pesado

### 502 Bad Gateway

- Porta do serviço deve ser **3000**
- Veja logs do container: `Error: listen EADDRINUSE` ou crash no boot

### IA não funciona

- Chave OpenRouter válida e com crédito
- `OPENAI_BASE_URL=https://openrouter.ai/api/v1` (sem barra extra no final)
- Modelo existe em https://openrouter.ai/models

### Site antigo (Cloudflare Pages) ainda abre

- DNS ainda aponta para Pages — aguarde propagação (até 48h, geralmente minutos)
- Limpe cache do browser ou teste em aba anônima

---

## Atualizações futuras

Cada `git push` na `main` (com Auto Deploy) reconstrói e publica.

Próximo módulo planejado: **Estúdio de Estampas** — ver [estudio-estampas.md](./estudio-estampas.md).
