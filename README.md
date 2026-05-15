# DevToolbox

> Caixa de ferramentas gratuita para desenvolvedores, com IA integrada.
> Disponível em: [devtools.catiteo.com](https://devtools.catiteo.com)

![DevToolbox](https://img.shields.io/badge/status-ativo-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/licença-MIT-green)

---

## Documentação

Planejamento técnico, migração Easypanel e Estúdio de Estampas: **[docs/](./docs/)**

---

## Sobre o projeto

O **DevToolbox** é uma plataforma open-source com ferramentas essenciais para o dia a dia de desenvolvedores. A maioria roda **100% no navegador** — sem login, sem coleta de dados nas ferramentas client-side.

As ferramentas com **IA** usam **Cloudflare Workers AI** (Llama 3) para explicar código, revisar boas práticas e converter entre linguagens.

---

## Ferramentas disponíveis (21)

| Ferramenta | Categoria | IA | Client-side |
| --- | --- | --- | --- |
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
Hospedagem:  Cloudflare Pages + Workers (edge)
IA:          Cloudflare Workers AI — Llama 3 8B Instruct
Deploy:      OpenNext para Cloudflare
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

> **IA:** funcionalidades de IA dependem do binding Cloudflare em produção. Localmente, a API retorna indisponibilidade.

### Testes

```bash
npm test
```

---

## Deploy no Cloudflare Pages

```bash
wrangler login
npm run pages:build
npm run deploy
```

Domínio customizado: `devtools.catiteo.com` → CNAME para `developer-toolbox.pages.dev`.

---

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Desenvolvimento local |
| `npm run build` | Build Next.js |
| `npm test` | Testes Vitest |
| `npm run pages:build` | Build OpenNext + Cloudflare |
| `npm run deploy` | Deploy para Cloudflare Pages |

---

## Privacidade e segurança

- Ferramentas client-side não enviam seu input ao servidor.
- APIs de rede (DNS, Headers) bloqueiam endereços privados e têm rate limit por IP.
- Rotas de IA limitam tamanho do payload e taxa de requisições.
- Detalhes: [/privacidade](https://devtools.catiteo.com/privacidade)

---

## Licença

MIT
