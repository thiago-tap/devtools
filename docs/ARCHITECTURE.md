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
