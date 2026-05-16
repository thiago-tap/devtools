# 15-05-2026 21:00 — Push e ferramentas DevToolbox

> **Sessão:** recuperação pós-queda de energia, fecho de features, CI, lint, commit e push para `origin/main`.

## Resumo

Entrega de um conjunto alargado de ferramentas client-side e APIs de apoio, pipeline de imagens “para dev”, testes, CI no GitHub, correções de build/lint e publicação no repositório remoto.

## Ferramentas e páginas (`/tools/...`)

- **QR Code** — geração no browser (PNG / data URL).
- **Slug** — normalização para URL (`lib/tools/slug.ts` + testes).
- **Semver** — comparação e bumps (com `@types/semver`).
- **JSONPath** — consultas com `jsonpath-plus`.
- **Lorem / dados de exemplo** — `@faker-js/faker` com seed.
- **PEM / X.509** — leitura de certificados no client (`reflect-metadata` + `@peculiar/x509` via import dinâmico).
- **Imagem para dev** — remoção de metadados e ZIP de favicons (`/api/images/process`, `lib/images/favicon-pack.ts`).
- **Rede:** redirects (`/api/redirect-chain`), meta/Open Graph (`/api/meta-preview`), sonda CORS (`/api/cors-probe`) com páginas correspondentes.
- **JWT** — separador **Decodificar** e **Gerar (HS256)** (`lib/tools/jwt-sign.ts` + testes).
- **JSON** — suporte a query **`?mode=format|minify|typescript`** com `Suspense` + `useSearchParams`.

Catálogo atualizado em `lib/tools.ts`, tipos `addedAt` em `types/index.ts`, ícones na sidebar e secção **Novidades** na home (`components/home/tools-explorer.tsx` — correção de `newsTools` em `useMemo`).

## Imagem e API

- Ações `strip_metadata` e `favicon_pack` na rota de processamento de imagens.
- `zipResponse` e ajustes em `lib/api/image-upload.ts` / pipeline onde aplicável.

## Testes e qualidade

- **Vitest:** `slug.test.ts`, `jwt-sign.test.ts`; restantes testes a verde.
- **Playwright:** `e2e/smoke.spec.ts`, `playwright.config.ts` com `webServer` + `next start`.
- **ESLint:** `eslint.config.mjs` (flat + Next), plugins necessários; regra `react-hooks/set-state-in-effect` desligada por incompatibilidade com padrões existentes; pequenos fixes (`Input`/`Textarea`, `cron`, regex, `prefer-const`, CORS `Origin: origin`, JSONPath typing).

## `next.config.js`

- `eslint.ignoreDuringBuilds` e `typescript.ignoreBuildErrors` em **`false`** para build validar tipos e lint.

## CI (GitHub Actions)

- Workflow `.github/workflows/ci.yml` em **dois jobs:**
  - **`verify`** (push + PR para `main`): `npm ci` → lint → type-check → test → build.
  - **`e2e`** só em **`push` em `main`**: cache Playwright, Chromium, build, `npm run e2e` — PRs ficam mais rápidos.

## PWA

- `public/manifest.json` — atalhos para JSON, Base64 e JWT.

## Git

- **Commit:** `9b66998` — `feat: ferramentas dev, APIs rede/imagem, CI e smoke E2E`.
- **Push:** `main` → `https://github.com/thiago-tap/devtools.git` (`ffd1109..9b66998`).

## Notas

- Nome do ficheiro usa **`HH-mm`** em vez de `HH:mm` por limitação de caracteres nos paths Windows (`:` inválido no nome do ficheiro). O título com **21:00** está no cabeçalho deste documento.

## Próximos passos sugeridos (opcional)

- Correr `npm run e2e` localmente após `npm run build` se quiser validar smoke antes de merges grandes.
- Rever `npm audit` (vulnerabilidades reportadas após instalação de dependências).
