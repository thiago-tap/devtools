# Documentação — DevToolbox

Índice da documentação técnica e de produto do projeto.

| Documento | Conteúdo |
|-----------|----------|
| [estado-atual.md](./estado-atual.md) | O que existe hoje: ferramentas, stack, APIs, deploy |
| [limitacoes-cloudflare.md](./limitacoes-cloudflare.md) | Por que o edge limita imagens e libs nativas |
| [estudio-estampas.md](./estudio-estampas.md) | Visão do módulo de arte para camisetas (fundo, cores, halftone, vetor) |
| [migracao-easypanel.md](./migracao-easypanel.md) | Plano de migração Cloudflare → Easypanel |
| [roadmap.md](./roadmap.md) | Fases de trabalho (agora → pós-migração) |

## Contexto rápido

- **Produção:** [devtools.catiteo.com](https://devtools.catiteo.com)
- **Repositório:** `https://github.com/thiago-tap/devtools`
- **Hoje:** Next.js 15 no **Cloudflare Pages** (OpenNext + Workers AI)
- **Próximo passo acordado:** migrar para **Easypanel** (Node/Docker) e, em seguida, construir o **Estúdio de Estampas** (processamento de imagem no servidor)

## Ordem de execução

1. Ler [estado-atual.md](./estado-atual.md) e [migracao-easypanel.md](./migracao-easypanel.md)
2. Executar migração para Easypanel
3. Implementar fases do [roadmap.md](./roadmap.md), começando pelo Estúdio de Estampas em [estudio-estampas.md](./estudio-estampas.md)

*Última atualização: maio/2026*
