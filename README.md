# DevToolbox

> Caixa de ferramentas gratuita para desenvolvedores, com IA integrada.
> Disponível em: [devtools.catiteo.com](https://devtools.catiteo.com)

![DevToolbox](https://img.shields.io/badge/status-ativo-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-Easypanel-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/licença-MIT-green)

---

## Documentação

Planejamento técnico, migração Easypanel e Estúdio de Estampas: **[docs/](./docs/)**

---

## Sobre o projeto

O **DevToolbox** é uma plataforma open-source com ferramentas essenciais para o dia a dia de desenvolvedores. A maioria roda **100% no navegador** — sem login, sem coleta de dados nas ferramentas client-side.

As ferramentas com **IA** usam um provedor configurável no servidor (**OpenAI-compatible** ou **Ollama**) para explicar código, revisar boas práticas e converter entre linguagens.

---

## Ferramentas disponíveis (22)

| Ferramenta | Categoria | IA | Client-side |
| --- | --- | --- | --- |
| Estúdio de Estampas | Imagens | Não | Não (API Sharp) |
| Formatador JSON | JSON | Sim | Sim |
| YAML ↔ JSON | JSON | Não | Sim |
| Testador de Regex | Texto | Sim | Sim |
| Comparador de Texto | Texto | Não | Sim |
| Preview Markdown | Texto | Não | Sim |
| Codificador Base64 / URL / HTML | Codificação | Não | Sim |
| Decodificador JWT | Segurança | Não | Sim |
| Gerador de Secrets (openssl rand) | Segurança | Não | Sim |
| Gerador de Hash (MD5, SHA-2/3, BLAKE2b, HMAC) | Segurança | Não | Sim |
| Gerador de Senha | Segurança | Não | Sim |
| Conversor de Cores | Cores | Não | Sim |
| Revisão de Código IA | Código | Sim | Não |
| Formatador SQL | Banco de Dados | Sim | Sim |
| Gerador de UUID | Utilitários | Não | Sim |
| Interpretador Cron | Utilitários | Não | Sim |
| Conversor de Timestamp | Utilitários | Não | Sim |
| MIME Types | Utilitários | Não | Sim |
| Formatador .env | Utilitários | Não | Sim |
| Conversor de bases (bin/oct/dec/hex) | Utilitários | Não | Sim |
| DNS Check | Rede | Não | Não (API) |
| HTTP Headers Inspector | Rede | Não | Não (API) |

---

## Stack tecnológica

```
Frontend:    Next.js 15 (App Router) + TypeScript + Tailwind CSS
Hospedagem:  Easypanel / Docker (Node.js 20)
IA:          OpenAI API, Groq, OpenRouter ou Ollama (env)
Deploy:      Dockerfile (Next.js standalone)
Testes:      Vitest (lib/tools)
```

---

## Rodando localmente

```bash
git clone https://github.com/SEU_USUARIO/developer-toolbox.git
cd developer-toolbox
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

> **IA:** copie `.env.example` para `.env` e configure `OPENAI_API_KEY` ou `OLLAMA_BASE_URL`.

### Testes

```bash
npm test
```

---

## Deploy no Easypanel (Docker)

1. Crie um app **Docker** no Easypanel apontando para este repositório.
2. Build: usa o `Dockerfile` na raiz (Next.js `standalone`).
3. Porta **3000**, variáveis de ambiente (ver `.env.example`):

   - `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`
   - `OPENAI_API_KEY` + opcional `OPENAI_BASE_URL`, `AI_MODEL`
   - ou `OLLAMA_BASE_URL` + `OLLAMA_MODEL`

4. Aponte o domínio `devtools.catiteo.com` para o serviço Easypanel.

**Remover fundo (Rembg):** não entra no `Dockerfile` principal (seria Node + Python + modelos na mesma imagem). No repositório há `Dockerfile.rembg` e o `docker-compose.yml` sobe **app + rembg** juntos no ambiente local. No Easypanel, crie um **segundo** serviço com **Dockerfile** = `Dockerfile.rembg` (mesmo repo) e defina `REMBG_BASE_URL=http://<nome-do-servico-rembg>:7000` no app — detalhes em [docs/easypanel-setup.md](./docs/easypanel-setup.md).

### Docker local (`docker-compose.yml`)

| Serviço | Função | Porta (host) |
| --- | --- | --- |
| **app** | DevToolbox (Next.js) | **3000** |
| **rembg** | Remoção de fundo (rede interna `rembg:7000`) | — |
| **uptime-kuma** | Monitoramento opcional (perfil `monitoring`) | **3001** |

```bash
cp .env.example .env
# edite .env com suas chaves
docker compose up --build

# opcional: Uptime Kuma para monitorar URLs (operador)
docker compose --profile monitoring up --build
```

No Compose, `REMBG_BASE_URL` padrão já é `http://rembg:7000`. Volume `rembg_models` persiste os modelos ONNX entre restarts.

Deploy Cloudflare anterior: ver `docs/legacy/cloudflare-wrangler.toml`.

---

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Build Next.js (standalone) |
| `npm run start` | Produção local após build |
| `npm test` | Testes Vitest |

---

## Privacidade e segurança

- Ferramentas client-side não enviam seu input ao servidor.
- APIs de rede (DNS, Headers) bloqueiam endereços privados e têm rate limit por IP.
- Rotas de IA limitam tamanho do payload e taxa de requisições.
- Detalhes: [/privacidade](https://devtools.catiteo.com/privacidade)

---

## Licença

MIT
