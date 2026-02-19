# DevToolbox

> Caixa de ferramentas gratuita para desenvolvedores, com IA integrada.
> Disponível em: [devtools.catiteo.com](https://devtools.catiteo.com)

![DevToolbox](https://img.shields.io/badge/status-ativo-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/licença-MIT-green)

---

## Sobre o projeto

O **DevToolbox** é uma plataforma open-source com ferramentas essenciais para o dia a dia de desenvolvedores. Todas as ferramentas rodam no navegador — sem coletar dados, sem login, sem custos.

As ferramentas com **IA** usam o **Cloudflare Workers AI** (Llama 3) para explicar código, revisar boas práticas e converter entre linguagens.

---

## Ferramentas disponíveis (13)

| Ferramenta | Categoria | IA |
|---|---|---|
| JSON Formatter | JSON | Sim |
| Regex Tester | Texto | Sim |
| Base64 / URL / HTML Encoder | Codificação | Não |
| JWT Decoder | Segurança | Não |
| Hash Generator (MD5, SHA-1, SHA-256, SHA-512) | Segurança | Não |
| Color Converter (HEX, RGB, HSL, HSV, CMYK) | Cores | Não |
| Password Generator | Segurança | Não |
| UUID Generator | Utilitários | Não |
| Text Diff | Texto | Não |
| Markdown Preview | Texto | Não |
| AI Code Review | Código | Sim |
| SQL Formatter | Banco de Dados | Sim |
| Cron Parser | Utilitários | Não |

---

## Stack tecnológica

```
Frontend:    Next.js 15 (App Router) + TypeScript + Tailwind CSS
Hospedagem:  Cloudflare Pages
Backend:     Cloudflare Workers (edge functions)
IA:          Cloudflare Workers AI — Llama 3 8B Instruct
Deploy:      OpenNext para Cloudflare
```

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/developer-toolbox.git
cd developer-toolbox

# 2. Instale as dependências
npm install

# 3. Rode o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

> **Nota:** As funcionalidades de IA só funcionam em produção (Cloudflare), pois dependem do Cloudflare Workers AI. Localmente, o botão retornará uma mensagem de indisponibilidade.

---

## Deploy no Cloudflare Pages

### Pré-requisitos

- Conta no [Cloudflare](https://cloudflare.com) (gratuita)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) instalado

### Passo a passo

```bash
# 1. Login no Cloudflare
wrangler login

# 2. Gerar o build para Cloudflare
npm run pages:build

# 3. Deploy
npm run deploy
```

### Configurar domínio customizado

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **Pages** → seu projeto → **Domínios Personalizados**
3. Adicione `devtools.catiteo.com`
4. Configure o registro CNAME no DNS da catiteo.com apontando para `developer-toolbox.pages.dev`

### Habilitar o Cloudflare AI

No `wrangler.toml`, o binding de IA já está configurado:

```toml
[ai]
binding = "AI"
```

Ao fazer o deploy, o Cloudflare injeta automaticamente o binding `AI` no Workers AI.

---

## Estrutura do projeto

```
developer-toolbox/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── explain/route.ts   # API: explica JSON, regex, SQL
│   │       ├── review/route.ts    # API: revisa código
│   │       └── convert/route.ts  # API: converte entre linguagens
│   ├── tools/
│   │   ├── json/page.tsx
│   │   ├── regex/page.tsx
│   │   ├── base64/page.tsx
│   │   ├── jwt/page.tsx
│   │   ├── hash/page.tsx
│   │   ├── colors/page.tsx
│   │   ├── password/page.tsx
│   │   ├── uuid/page.tsx
│   │   ├── diff/page.tsx
│   │   ├── markdown/page.tsx
│   │   ├── code-review/page.tsx
│   │   ├── sql/page.tsx
│   │   └── cron/page.tsx
│   ├── globals.css
│   ├── layout.tsx               # SEO global, ThemeProvider
│   ├── page.tsx                 # Home — grid de ferramentas
│   ├── sitemap.ts               # Sitemap automático
│   └── robots.ts                # robots.txt
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx          # Navegação lateral
│   │   ├── theme-toggle.tsx     # Botão dark/light
│   │   └── tool-layout.tsx      # Layout padrão de ferramenta
│   ├── providers/
│   │   └── theme-provider.tsx   # Contexto de tema
│   ├── tools/
│   │   └── copy-button.tsx      # Botão copiar
│   └── ui/                      # Componentes base (Button, Badge, etc.)
├── lib/
│   ├── tools/
│   │   ├── json.ts              # Lógica JSON
│   │   ├── base64.ts            # Lógica Base64/URL/HTML
│   │   ├── jwt.ts               # Lógica JWT
│   │   ├── hash.ts              # Lógica hashes
│   │   ├── colors.ts            # Lógica cores
│   │   ├── password.ts          # Lógica senhas
│   │   ├── sql.ts               # Lógica SQL
│   │   └── cron.ts              # Lógica cron
│   ├── tools.ts                 # Catálogo de ferramentas
│   └── utils.ts                 # Utilitários gerais
├── types/
│   └── index.ts                 # Tipos TypeScript
├── open-next.config.ts          # Config OpenNext para Cloudflare
├── wrangler.toml                # Config Cloudflare Workers
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Arquitetura e decisões técnicas

### Por que Cloudflare Pages + Workers?

- **Edge computing**: deploy em 300+ data centers globais com latência mínima
- **Free tier generoso**: 100k requests/dia, sem custo para portfolio
- **Workers AI**: modelos de IA rodando na edge, sem latência de cold start
- **Zero configuração de servidor**: infraestrutura totalmente gerenciada

### Por que OpenNext?

O `@cloudflare/next-on-pages` foi descontinuado. O **OpenNext** é o adaptador oficial recomendado pela Cloudflare para Next.js, com melhor suporte e manutenção ativa.

### Ferramentas client-side vs server-side

A maioria das ferramentas roda **100% no navegador** (sem chamadas de API):
- JSON, Base64, URL, JWT, Hash, Cores, Senha, UUID, Diff, Markdown, Cron

Apenas as features de IA fazem chamadas à API do Cloudflare Workers AI:
- Revisão de código, Explicação de JSON/Regex/SQL, Conversão de código

### Tema dark/light

Implementado sem bibliotecas externas:
1. Script inline no `<head>` aplica o tema antes da hidratação (previne flash)
2. `ThemeProvider` sincroniza com `localStorage`
3. CSS variables do Tailwind mudam via classe `.dark` / `.light` no `<html>`

---

## Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento local
npm run build        # Build de produção (Next.js)
npm run lint         # Verificação de lint
npm run type-check   # Verificação TypeScript
npm run pages:build  # Build para Cloudflare (OpenNext)
npm run preview      # Preview local do build Cloudflare
npm run deploy       # Deploy para Cloudflare Pages
```

---

## Variáveis de ambiente

Nenhuma variável de ambiente é necessária para rodar localmente. Para produção, o Cloudflare injeta automaticamente os bindings configurados no `wrangler.toml`.

---

## SEO

- Metadata completo (título, descrição, keywords)
- Open Graph para compartilhamento em redes sociais
- Twitter Card para preview no Twitter/X
- `sitemap.xml` gerado automaticamente em `/sitemap.xml`
- `robots.txt` em `/robots.txt`
- `lang="pt-BR"` no HTML
- URLs canônicas

---

## Contribuindo

Contribuições são bem-vindas!

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-ferramenta`
3. Faça suas alterações e commit: `git commit -m 'feat: adiciona nova ferramenta'`
4. Push: `git push origin feature/nova-ferramenta`
5. Abra um Pull Request

### Adicionando uma nova ferramenta

1. Adicione a definição em [lib/tools.ts](lib/tools.ts)
2. Crie a lógica pura em `lib/tools/sua-ferramenta.ts`
3. Crie a página em `app/tools/sua-ferramenta/page.tsx`

---

## Licença

MIT — use à vontade, inclusive comercialmente.

---

Feito com Next.js, Tailwind CSS e Cloudflare Workers AI.
