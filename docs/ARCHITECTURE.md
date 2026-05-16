# Arquitetura

O DevToolbox é um app Next.js com App Router. As ferramentas são registradas em `lib/tools.ts` e renderizadas por páginas em `app/tools/<id>`.

## Camadas

- `app/tools/*`: UI das ferramentas.
- `lib/tools/*`: lógica pura e testável.
- `app/api/*`: integrações server-side para rede, imagens e IA.
- `components/*`: layout, UI e home.
- `docs/*`: documentação operacional e roadmap.

## Tipos de ferramenta

- `client-only`: roda no navegador; ideal para dados sensíveis como JWT, chaves e textos.
- `server-api`: chama uma rota em `app/api`; usada quando precisa buscar URLs externas, DNS ou TLS.
- `ai-assisted`: envia conteúdo para API de IA; deve indicar isso claramente na UI.

## Catálogo

Cada item em `TOOLS` deve ter:

- `id`, `name`, `description`, `category`, `href`, `icon`;
- `tags` e `aliases` para busca;
- `privacy`;
- `addedAt` quando aparecer em Novidades.

## Segurança

Rotas que recebem URLs ou domínios devem:

- validar domínio público;
- bloquear localhost, IPs privados e metadados cloud;
- usar timeout;
- não devolver erros internos crus ao cliente.

## Estado local

Ferramentas podem usar:

- `useQueryParamState` para URLs compartilháveis;
- `useToolHistory` para histórico local limitado no browser.

## Contrato final de ferramenta

Cada ferramenta nova deve entregar:

- página em `app/tools/<id>/page.tsx`;
- metadata em `app/tools/<id>/layout.tsx`;
- entrada inicial útil ou exemplos;
- saída com `CopyButton` ou download;
- `aliases` para busca;
- `privacy` no catálogo;
- querystring compartilhável quando houver input principal;
- histórico local quando houver transformação recorrente;
- lógica pura em `lib/tools` quando a regra for testável;
- teste unitário para bibliotecas puras;
- nota clara quando a ferramenta chama APIs externas pelo servidor.

## SEO e descoberta

- Ferramentas usam `metadataForTool`.
- Coleções vivem em `/collections/[id]`.
- Categorias vivem em `/tools/categoria/[category]`.
- O sitemap inclui home, privacidade, categorias, coleções e ferramentas.

## PWA e cache

O service worker usa cache conservador:

- pré-cache apenas de `manifest.json` e `icon.svg`;
- cache runtime somente para assets estáticos same-origin (`/_next/static`, scripts, styles, imagens, fontes e manifest);
- nunca intercepta `/api/*`;
- não faz cache de páginas HTML dinâmicas, evitando conteúdo desatualizado em ferramentas e rotas server-side.

## Próxima fase local-first

- REST Client e collections usam storage local no navegador, sem login e sem banco.
- Requests externos passam por APIs server-side apenas quando precisam contornar CORS ou consultar URLs públicas.
- Rotas server-side devem usar helpers de URL pública, timeout, redirect manual/erro e leitura limitada.
- Ferramentas com IA devem ser opt-in, marcadas como `ai-assisted` e funcionar com fallback local quando possível.
