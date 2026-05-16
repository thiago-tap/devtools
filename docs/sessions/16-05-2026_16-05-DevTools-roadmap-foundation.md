# 16-05-2026 16:05 — DevTools roadmap foundation

> **Sessão:** implementação de uma grande leva do roadmap do DevToolbox, com novas ferramentas, melhorias de produto, documentação, SEO/PWA e validação.

## Resumo

Foi implementado um bloco amplo do roadmap para transformar o DevToolbox em uma plataforma mais completa de ferramentas para desenvolvimento. A entrega inclui uma nova Calculadora de Datas brasileira, DNS com modo Todos, melhorias de busca/coleções, novas ferramentas de API/segurança/schema, documentação e primeiros passos de PWA/offline.

## Product Foundation

- Adicionado suporte a `aliases` e `privacy` no catálogo de ferramentas.
- Busca passa a considerar aliases, além de nome, descrição e tags.
- Home ganhou coleções:
  - Debug de API;
  - Frontend;
  - Segurança;
  - Imagens;
  - JSON/API.
- Favoritos passaram a aparecer como área de ferramentas fixadas.
- Criados hooks reutilizáveis:
  - `useQueryParamState`;
  - `useToolHistory`.
- Base64 passou a usar `?input=` e histórico local.

## Datas e DNS

- Criada ferramenta `/tools/calculadora-datas`:
  - parsing `DD/MM/AAAA` e `DD/MM/AAAA HH:mm`;
  - soma/subtração de dias, semanas, meses e anos;
  - diferença entre datas;
  - cálculo de hoje até uma data;
  - decomposição em semanas, meses/anos aproximados e anos/meses/dias.
- Criada lógica pura em `lib/tools/date-calculator.ts`.
- Adicionados testes em `lib/tools/date-calculator.test.ts`.
- DNS checker ganhou opção **Todos**, consultando `A`, `AAAA`, `MX`, `TXT`, `NS`, `CNAME`, `SOA`, `SRV`, `CAA`.
- API de DNS usa timeout, `Promise.allSettled` no modo Todos e não vaza erros internos.

## Ferramentas novas

- `JSON Schema Validator`.
- `OpenAPI Viewer`.
- `JWK ↔ PEM`.
- `CSP Builder / Analyzer`.
- `Zod / TypeScript / Schema`.
- `HTTP Status / Latency`.
- `Robots/Sitemap Validator`.
- `SSL/TLS Checker`.
- `Webhook Mock`.
- Gerador de IDs expandido para UUID v4, UUID v7, ULID e NanoID.

## Network/API

- Adicionadas APIs:
  - `/api/http-status`;
  - `/api/robots-sitemap`;
  - `/api/ssl-check`;
  - `/api/webhook-mock`.
- As novas ferramentas foram incluídas nas coleções e no catálogo.

## Docs, SEO e PWA

- Criados:
  - `docs/CONTRIBUTING.md`;
  - `docs/ARCHITECTURE.md`.
- `docs/roadmap.md` atualizado com visão do roadmap e histórico anterior preservado.
- `app/sitemap.ts` passou a priorizar novidades.
- `public/manifest.json` ganhou atalhos para Datas e DNS.
- Criado service worker simples em `public/sw.js` e registro em produção.

## Validação

Executado com sucesso:

```bash
npm run lint
npm run type-check
npm test
npm run build
```

Resultado dos testes: 10 arquivos, 38 testes passando. Build gerou 62 rotas.

## Próximos passos sugeridos

- Subir esta leva como checkpoint estável.
- Em seguida, aprofundar o restante do roadmap:
  - histórico/querystring em todas as ferramentas;
  - páginas por categoria;
  - versões mais robustas de JWT verify/JWKS, JSON Schema, OpenAPI e webhook inspector;
  - SEO/PWA mais completo.
