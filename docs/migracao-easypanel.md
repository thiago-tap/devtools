# Migração Cloudflare Pages → Easypanel

Plano técnico para hospedar o DevToolbox em **Easypanel** (Docker/VPS) com **Node.js completo**, habilitando Sharp, processamento de imagem e o Estúdio de Estampas.

## Objetivos da migração

1. Runtime **Node tradicional** (`next start` ou standalone)
2. Liberdade para **Sharp**, CLIs (`vtracer`, ImageMagick), **rembg**
3. Timeouts e uploads maiores para imagens de estampa
4. Manter as **21 ferramentas** atuais funcionando
5. Substituir **Workers AI** por provedor configurável via env

## O que remover ou deixar de usar

| Item | Ação |
|------|------|
| `@opennextjs/cloudflare` | Remover dependência |
| `wrangler`, `wrangler.toml` | Remover ou arquivar em `docs/legacy/` |
| `open-next.config.ts` | Remover |
| `scripts/bundle-worker.js` | Remover |
| Scripts `pages:build`, `preview`, `deploy` (Cloudflare) | Substituir por Docker/Easypanel |
| `getCloudflareContext()` nas rotas IA | Refatorar para cliente LLM |

## O que permanece igual

- App Router, páginas em `app/tools/*`
- `lib/tools/*` (lógica client-side)
- `lib/api/security.ts` (rate limit, validação)
- Tailwind, componentes, catálogo `lib/tools.ts`
- Testes Vitest
- Domínio `devtools.catiteo.com` (apontar DNS para Easypanel)

## Substituir Workers AI

Rotas afetadas:

- `app/api/ai/explain/route.ts`
- `app/api/ai/convert/route.ts`
- `app/api/ai/review/route.ts`

### Opções de provedor

| Opção | Prós | Contras |
|-------|------|---------|
| **OpenAI / OpenRouter / Groq** | Simples, API key em env | Custo por token |
| **Ollama no mesmo VPS** | Custo fixo, privado | RAM/CPU, manutenção |
| **Desabilitar IA** temporariamente | Migração mais rápida | Perde feature até configurar |

### Implementação sugerida

Criar `lib/ai/client.ts`:

```ts
// Pseudocódigo — implementar na migração
export async function runChat(system: string, user: string): Promise<string> {
  // OPENAI_API_KEY ou OLLAMA_BASE_URL
}
```

Rotas IA passam a usar `runChat` em vez de `env.AI.run(...)`.

Atualizar `app/privacidade/page.tsx` com o novo provedor de IA.

## Dockerfile (esboço)

```dockerfile
FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Variante `standalone` (recomendada para imagem menor)

Em `next.config.js`:

```js
output: "standalone",
```

Build e CMD:

```dockerfile
CMD ["node", ".next/standalone/server.js"]
```

## Easypanel — checklist de deploy

1. Criar app **Docker** ou **Node** no Easypanel
2. Conectar repositório GitHub `thiago-tap/devtools`
3. Build: `npm ci && npm run build`
4. Start: `npm run start` ou `node .next/standalone/server.js`
5. Variáveis de ambiente:
   - `NEXT_PUBLIC_APP_URL=https://devtools.catiteo.com`
   - `NEXT_PUBLIC_APP_NAME=DevToolbox`
   - `OPENAI_API_KEY` ou `OLLAMA_BASE_URL` (IA)
   - Futuro: `MAX_UPLOAD_MB`, `TEMP_DIR`
6. Domínio + TLS (Traefik do Easypanel)
7. Health check: `GET /` ou rota dedicada

## DNS

- Alterar CNAME de `devtools.catiteo.com` de `*.pages.dev` para o host do Easypanel
- Manter Cloudflare como proxy (opcional) ou DNS direto

## Dependências futuras (Estúdio de Estampas)

Adicionar após migração base estável:

```json
"sharp": "^0.33.x"
```

Opcional no mesmo container ou sidecar:

- Python + `rembg` (porta interna ou CLI)
- `vtracer`, `potrace` via apt no Dockerfile
- `imagemagick` para halftone

Exemplo Dockerfile estendido (fase 2):

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    imagemagick potrace \
    && rm -rf /var/lib/apt/lists/*
```

## CI/CD sugerido

1. Push em `main` → GitHub Actions (opcional) ou webhook Easypanel
2. Build da imagem Docker
3. Deploy automático no Easypanel
4. Smoke test: home + `/tools/hash` + `/api/dns`

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Downtime na troca de DNS | TTL baixo antes; deploy Easypanel pronto antes de cortar |
| IA indisponível após migração | Configurar API key antes do cutover ou mensagem 503 clara |
| VPS único sem escala | Monitorar RAM (Sharp + rembg); limitar uploads |
| Regressão em ferramentas | Checklist manual das 21 tools + `npm test` |

## Ordem de execução (migração)

1. Branch `feat/easypanel-migration`
2. Adicionar Dockerfile + `output: 'standalone'`
3. Remover OpenNext/Wrangler; ajustar `package.json`
4. Implementar `lib/ai/client.ts` + refatorar 3 rotas IA
5. Testar `docker build` e `npm test` localmente
6. Deploy em Easypanel (subdomínio de teste opcional)
7. Validar todas as ferramentas
8. Trocar DNS produção
9. Iniciar [roadmap.md](./roadmap.md) — Estúdio de Estampas

## Rollback

Manter projeto Cloudflare Pages pausado (último deploy `main` anterior) até estabilizar Easypanel por alguns dias. Em caso de falha, reverter CNAME para Pages.

---

*Próximo passo imediato após esta documentação: executar a migração conforme checklist acima.*
