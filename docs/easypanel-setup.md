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
| Porta publicada do app (container) | **3000** |
| Protocolo | HTTP |

O `Dockerfile` expõe `PORT=3000` e `HOSTNAME=0.0.0.0`.

### Domínios — destino interno (importante)

Ao editar **Domínios** → **Detalhes** → **Destino**:

| Campo | Valor |
|-------|--------|
| Protocolo | HTTP |
| **Porta** | **3000** (não use 80) |
| Caminho | `/` |

O Next.js escuta na **3000**. Se o destino estiver em **80**, o site retorna *Service is not reachable*.

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
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Opcional — Estúdio de Estampas (upload)
MAX_UPLOAD_MB=25
```

**Importante:** `NEXT_PUBLIC_*` são embutidas no build. Se mudar a URL depois, faça **Rebuild** do serviço.

---

## Passo 6 — Domínio

1. Aba **Domains** (ou **Domínios**)
2. Adicione: `devtools.catiteo.com`
3. O Easypanel mostra o destino DNS (CNAME ou IP)

### DNS (Hostinger ou outro)

| Tipo | Nome | Destino |
|------|------|---------|
| **A** | `devtools` | IP público do VPS (ex.: `72.61.39.163`) |

SSL: Easypanel → domínio → aba **SSL** → `letsencrypt`. Libere portas **80** e **443** no firewall do VPS.

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
| Estampas | `/tools/estampas` → upload + preset DTF |
| DNS | `/tools/dns` → `google.com` |

Se IA retornar 503: confira `OPENAI_API_KEY` e logs do container.

---

## Troubleshooting

### Build falha por memória

- Aumente RAM do VPS ou limite paralelismo
- O stage `npm run build` do Next.js é o mais pesado

### 502 / Service is not reachable

- Porta do **Destino** no domínio deve ser **3000** (não 80)
- Porta publicada do app no serviço: **3000**
- Veja logs: `Ready on 0.0.0.0:3000`

### 502 Bad Gateway

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

**Estúdio de Estampas** (MVP): [estudio-estampas.md](./estudio-estampas.md) · rota `/tools/estampas`
