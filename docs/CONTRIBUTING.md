# Contribuindo

## Setup

```bash
npm ci
npm run dev
```

## Validação antes de PR

```bash
npm run lint
npm run type-check
npm test
npm run build
```

## Como adicionar uma ferramenta

1. Criar `app/tools/<id>/layout.tsx` com `metadataForTool("<id>")`.
2. Criar `app/tools/<id>/page.tsx`.
3. Registrar a ferramenta em `lib/tools.ts`.
4. Adicionar tags, aliases e `privacy`.
5. Se houver lógica pura, colocá-la em `lib/tools/<id>.ts` e criar teste.
6. Se usar API server-side, validar entrada e bloquear SSRF quando receber URL/domínio.
7. Adicionar a ferramenta a uma coleção em `TOOL_COLLECTIONS` quando fizer sentido.
8. Atualizar ou criar testes se houver lógica pura.
9. Rodar a validação completa antes de abrir PR.

## Contrato mínimo de ferramenta

- Entrada clara e exemplos.
- Saída copiável ou baixável.
- Estado compartilhável via querystring quando fizer sentido.
- Histórico local para ferramentas de transformação recorrente.
- Privacidade explícita: `client-only`, `server-api` ou `ai-assisted`.
- Testes para parsing, validação e transformação.

## Checklist de PR

- [ ] A ferramenta aparece no catálogo e na home.
- [ ] Tags e aliases cobrem termos comuns de busca.
- [ ] `privacy` está preenchido.
- [ ] Querystring/histórico foram considerados.
- [ ] API server-side usa timeout e validação.
- [ ] `npm run lint` passou.
- [ ] `npm run type-check` passou.
- [ ] `npm test` passou.
- [ ] `npm run build` passou.
