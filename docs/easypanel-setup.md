# Configurar DevToolbox no Easypanel

Guia para o projeto **sistemasdev** (ou qualquer projeto Easypanel vazio).

> **Quer subir site + Rembg + domínio de uma vez?** Siga o **[Checklist de produção no Easypanel](#checklist-de-produção-no-easypanel)**.  
> **Deploy:** com **Auto Deploy** ligado no GitHub, qualquer push na branch `main` dispara novo build no Easypanel.

## Pré-requisitos

- Repositório: `https://github.com/thiago-tap/devtools` (branch `main`)
- Domínio: `devtools.catiteo.com`
- Chave OpenRouter (nova, se a anterior foi exposta): https://openrouter.ai/keys
- **VPS:** RAM suficiente (Rembg costuma precisar de **≥ 2 GB** só para ele em picos)

---

## Checklist de produção no Easypanel

O Easypanel **não lê** o `docker-compose.yml` do Git automaticamente em todo tipo de app. Para produção você cria **um serviço por container**, no **mesmo projeto**, na ordem abaixo.

### A. Criar o serviço **Rembg** (nome do host fixo)

1. Projeto Easypanel → **+ Serviço** → **App** (ou Docker).
2. **Nome do serviço:** use exatamente `rembg` (minúsculo). Esse nome vira o hostname interno `http://rembg:7000` na maioria dos setups.
3. **Fonte GitHub:** mesmo repo `thiago-tap/devtools`, branch `main`.
4. **Build:**
   - Método: **Dockerfile**
   - **Caminho do Dockerfile:** `Dockerfile.rembg` (não use o `Dockerfile` da raiz aqui).
   - Contexto: `.` (raiz do repo).
5. **Porta do container / exposta:** **7000**.
6. **Domínio público:** não precisa (Rembg fica só na rede interna).
7. **Deploy** e aguarde **Running**. Nos **logs**, espere o servidor HTTP na porta 7000; na **primeira** requisição de remoção de fundo pode baixar modelo (demora).

**Alternativa** (sem build do repo): mesmo nome `rembg`, mas em vez de Dockerfile use **somente imagem** `danielgatis/rembg:latest` com comando/args:  
`s --host 0.0.0.0 --port 7000 --log_level info` e porta **7000**.

### B. Criar o serviço **DevToolbox** (site público)

1. **+ Serviço** → **App**.
2. Nome sugerido: `devtools`.
3. **GitHub:** `thiago-tap/devtools`, branch `main`, **Auto Deploy** ligado.
4. **Build:**
   - Dockerfile na **raiz** (`Dockerfile` padrão, caminho `/` ou deixe em branco conforme o painel).
   - Contexto: `.`
   - O estágio de produção instala **potrace** (vetorização SVG e passos `vectorize` no pipeline). Após atualizar o repositório, faça **Rebuild** completo do serviço para garantir o binário na imagem.
5. **Porta publicada do container:** **3000**.

### C. Variáveis de ambiente no **DevToolbox** (obrigatório)

Na aba **Environment** do serviço **devtools**, use (ajuste domínio e chave):

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_APP_URL=https://devtools.catiteo.com
NEXT_PUBLIC_APP_NAME=DevToolbox

OPENAI_API_KEY=sua-chave-openrouter
OPENAI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free

MAX_UPLOAD_MB=25

REMBG_BASE_URL=http://rembg:7000
REMBG_RATE_LIMIT_PER_MIN=12
```

- Se o nome do serviço Rembg **não** for `rembg`, troque o host em `REMBG_BASE_URL` (ex.: `http://nome-que-voce-definiu:7000`).
- Após mudar **`NEXT_PUBLIC_*`**, faça **Rebuild** do DevToolbox (são embutidas no build).

### D. Domínio do site (DevToolbox)

1. No serviço **devtools** → **Domínios** → adicionar `devtools.catiteo.com`.
2. **Destino interno:** protocolo **HTTP**, porta **3000** (não 80).
3. **SSL** → Let’s Encrypt.
4. DNS na Hostinger (ex.): registo **A** `devtools` → IP do VPS. Portas **80** e **443** abertas no firewall.

### E. Deploy final e validação

1. **Salvar** e **Deploy / Restart** no **devtools** (depois que o Rembg já está Running).
2. No navegador:
   - `https://devtools.catiteo.com/` — home
   - `https://devtools.catiteo.com/api/images/process` — deve retornar `{"rembg":true}` se `REMBG_BASE_URL` estiver certo e o Rembg acessível
   - `https://devtools.catiteo.com/tools/estampas` — upload + preset DTF; aba **Remover fundo** após o passo 2

### F. Uptime Kuma (opcional — só para você)

1. **+ Serviço** → imagem **`louislam/uptime-kuma:1`**, porta **3001**.
2. Pode expor com domínio **separado** e senha forte, ou só IP:3001 (não é para usuários finais).
3. Cadastre um monitor para `https://devtools.catiteo.com`.

### Se `rembg:7000` não resolver na rede interna

Alguns painéis usam hostname composto. No Easypanel, procure **hostname / internal URL / Docker network** do serviço Rembg e use esse host em `REMBG_BASE_URL` (sempre `http://...:7000`). Se houver terminal/exec no container devtools, um `wget -qO- http://rembg:7000/docs` ajuda a testar.

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

# Remover fundo (Rembg no Easypanel — ver seção abaixo)
# REMBG_BASE_URL=http://rembg:7000
# REMBG_RATE_LIMIT_PER_MIN=12
```

**Importante:** `NEXT_PUBLIC_*` são embutidas no build. Se mudar a URL depois, faça **Rebuild** do serviço.

Após configurar `REMBG_BASE_URL`, faça **redeploy** do app para aplicar a variável (não precisa ser build-time, é runtime — mas Easypanel às vezes exige restart).

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
| Estampas — fundo | Com Rembg: aba *Remover fundo* ou preset *DTF sem fundo* |
| DNS | `/tools/dns` → `google.com` |

Se IA retornar 503: confira `OPENAI_API_KEY` e logs do container.

---

## Stack de containers (referência)

O `docker-compose.yml` no repositório reflete o que combinamos: **app público**, **Rembg** para alta qualidade no remover fundo, **sem** banco multi-usuário / catálogo.

| Serviço Compose | Dockerfile / imagem | Porta | Obrigatório |
|-----------------|---------------------|-------|-------------|
| **app** | `Dockerfile` | **3000** | Sim |
| **rembg** | `Dockerfile.rembg` | **7000** (interna) | Sim para remover fundo nas estampas |
| **uptime-kuma** | `louislam/uptime-kuma:1` | **3001** (perfil `monitoring`) | Não — só para o operador monitorar URLs |

No **Easypanel**, o equivalente é **um serviço por linha** (mesmo repositório Git): app com `Dockerfile` na raiz, Rembg com `Dockerfile.rembg` ou imagem Hub, e opcionalmente Kuma com a imagem oficial (domínio só para você, não para usuários finais).

---

## Rembg — remover fundo (Estúdio de Estampas)

O app chama o servidor HTTP oficial do Rembg (`POST /api/remove`). O processamento pesado fica **fora** do container Node.

**Por que não fundir com o `Dockerfile` principal?** Lá só entra **Node + Sharp**. O Rembg é **Python + ONNX + modelos** (imagem bem maior). Um único Dockerfile com os dois deixaria o deploy pesado, gastaria muita RAM num só contêiner e exigiria dois processos (anti‑padrão). No repo a configuração fica em **`Dockerfile.rembg`** + **`docker-compose.yml`**.

### 1a. Easypanel — dois serviços no **mesmo** projeto (recomendado)

| Serviço | Dockerfile | Porta interna |
|---------|------------|---------------|
| **DevToolbox** | `Dockerfile` (raiz) | **3000** |
| **Rembg** | `Dockerfile.rembg` (raiz) | **7000** |

O **`Dockerfile.rembg`** herda `danielgatis/rembg` e fixa `rembg s --host 0.0.0.0 --port 7000`.

No **DevToolbox**:

```env
REMBG_BASE_URL=http://NOME_INTERNO_DO_SERVICO_REMBG:7000
```

### 1b. Easypanel — só imagem Docker Hub

Template “Rembg” na loja **pode não existir** — use um segundo app só com registry:

| Campo | Valor |
|-------|--------|
| **Imagem** | `danielgatis/rembg:latest` |
| **Args / comando** | `s --host 0.0.0.0 --port 7000 --log_level info` |
| **Porta** | **7000** |

### 1c. Teste na VPS (opcional)

`docker run --rm -p 7000:7000 danielgatis/rembg s --host 0.0.0.0 --port 7000`

### 2. Ligar o DevToolbox ao Rembg

No serviço **DevToolbox**, em **Environment**, adicione (ajuste o host ao nome real):

```env
REMBG_BASE_URL=http://rembg:7000
```

Use **HTTP** e hostname **interno**, não a URL pública — o tráfego não sai da VPS.

Opcional:

```env
REMBG_TIMEOUT_MS=180000
REMBG_RATE_LIMIT_PER_MIN=12
```

### 3. Redeploy

Salve as variáveis e **reinicie / redeploy** o app DevToolbox. Teste `GET /api/images/process` — resposta JSON `{"rembg":true}` quando configurado.

### 4. Recursos e monitoramento

- **RAM:** o Rembg carrega modelos ONNX; reserve **≥ 2 GB** livres para o container (idealmente mais em produção com pico).
- **CPU:** primeira requisição pode demorar (download do modelo); depois, tempo varia com pixels.
- **Monitoramento (opcional):** template **Uptime Kuma** no Easypanel para vigiar `https://devtools.catiteo.com` e, se quiser, a porta interna via health customizado.

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

### Remoção de fundo 503 ou “não configurada”

- Defina `REMBG_BASE_URL` no serviço DevToolbox (URL interna, ex.: `http://rembg:7000`)
- Confirme que o container Rembg está **Running** e escutando na porta esperada (geralmente **7000**)
- Veja logs do Rembg na primeira requisição (download do modelo)

### Site antigo (Cloudflare Pages) ainda abre

- DNS ainda aponta para Pages — aguarde propagação (até 48h, geralmente minutos)
- Limpe cache do browser ou teste em aba anônima

---

## Atualizações futuras

Cada `git push` na `main` (com Auto Deploy) reconstrói e publica.

**Estúdio de Estampas** (MVP): [estudio-estampas.md](./estudio-estampas.md) · rota `/tools/estampas`
