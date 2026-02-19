import type { Tool } from "@/types";

export const TOOLS: Tool[] = [
  {
    id: "json",
    name: "Formatador JSON",
    description: "Formate, valide, minifique e converta JSON para TypeScript",
    category: "JSON",
    href: "/tools/json",
    icon: "Braces",
    tags: ["json", "formatar", "validar", "typescript"],
    hasAI: true,
  },
  {
    id: "regex",
    name: "Testador de Regex",
    description: "Teste expressões regulares com highlighting e explicação por IA",
    category: "Text",
    href: "/tools/regex",
    icon: "Regex",
    tags: ["regex", "regexp", "padrão", "expressão regular"],
    hasAI: true,
  },
  {
    id: "base64",
    name: "Codificador Base64",
    description: "Codifique e decodifique Base64, URL e entidades HTML",
    category: "Encoding",
    href: "/tools/base64",
    icon: "Binary",
    tags: ["base64", "codificar", "decodificar", "url", "html"],
  },
  {
    id: "jwt",
    name: "Decodificador JWT",
    description: "Decodifique e inspecione tokens JWT com validação de expiração",
    category: "Security",
    href: "/tools/jwt",
    icon: "KeyRound",
    tags: ["jwt", "token", "auth", "decodificar"],
  },
  {
    id: "hash",
    name: "Gerador de Hash",
    description: "Gere hashes MD5, SHA-1, SHA-256 e SHA-512",
    category: "Security",
    href: "/tools/hash",
    icon: "Hash",
    tags: ["hash", "sha256", "md5", "criptografia"],
  },
  {
    id: "colors",
    name: "Conversor de Cores",
    description: "Converta entre HEX, RGB, HSL, HSV e CMYK com preview",
    category: "Colors",
    href: "/tools/colors",
    icon: "Palette",
    tags: ["cor", "hex", "rgb", "hsl", "css"],
  },
  {
    id: "password",
    name: "Gerador de Senha",
    description: "Gere senhas seguras com regras customizáveis e análise de força",
    category: "Security",
    href: "/tools/password",
    icon: "ShieldCheck",
    tags: ["senha", "segurança", "gerador", "aleatório"],
  },
  {
    id: "uuid",
    name: "Gerador de UUID",
    description: "Gere UUIDs v4 criptograficamente seguros em massa",
    category: "Utilities",
    href: "/tools/uuid",
    icon: "Fingerprint",
    tags: ["uuid", "guid", "id", "único"],
  },
  {
    id: "diff",
    name: "Comparador de Texto",
    description: "Compare dois textos e visualize as diferenças com highlighting",
    category: "Text",
    href: "/tools/diff",
    icon: "GitCompare",
    tags: ["diff", "comparar", "texto", "diferenças"],
  },
  {
    id: "markdown",
    name: "Preview Markdown",
    description: "Escreva Markdown e veja o preview renderizado em tempo real",
    category: "Text",
    href: "/tools/markdown",
    icon: "FileText",
    tags: ["markdown", "md", "preview", "renderizar"],
  },
  {
    id: "code-review",
    name: "Revisão de Código IA",
    description: "Revise seu código com IA: bugs, performance e boas práticas",
    category: "Code",
    href: "/tools/code-review",
    icon: "Bot",
    tags: ["ia", "código", "revisão", "refatorar"],
    hasAI: true,
    isNew: true,
  },
  {
    id: "sql",
    name: "Formatador SQL",
    description: "Formate queries SQL e obtenha explicações por IA",
    category: "Database",
    href: "/tools/sql",
    icon: "Database",
    tags: ["sql", "banco de dados", "query", "formatar"],
    hasAI: true,
  },
  {
    id: "cron",
    name: "Interpretador Cron",
    description: "Interprete e gere expressões cron com descrição em português",
    category: "Utilities",
    href: "/tools/cron",
    icon: "Clock",
    tags: ["cron", "agendamento", "tempo", "job"],
  },
];

export const CATEGORIES = [
  ...new Set(TOOLS.map((t) => t.category)),
] as const;

export function getToolsByCategory(category: string) {
  return TOOLS.filter((t) => t.category === category);
}

export function searchTools(query: string) {
  const q = query.toLowerCase();
  return TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
  );
}
