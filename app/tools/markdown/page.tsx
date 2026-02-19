"use client";
import { useState, useEffect, useRef } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { marked } from "marked";
import { downloadText } from "@/lib/utils";
import { Download } from "lucide-react";

const SAMPLE = `# Bem-vindo ao Markdown Preview

## Formatação básica

**Negrito**, *itálico*, ~~tachado~~ e \`código inline\`.

## Lista

- Item 1
- Item 2
  - Sub-item
- Item 3

## Código

\`\`\`typescript
function hello(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Tabela

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| id   | string | Sim |
| name | string | Sim |
| age  | number | Não |

> Citação importante aqui.
`;

export default function MarkdownPage() {
  const [input, setInput] = useState(SAMPLE);
  const [html, setHtml] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHtml(marked(input) as string);
  }, [input]);

  return (
    <ToolLayout title="Preview Markdown" description="Escreva Markdown e veja o preview renderizado em tempo real">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => downloadText(input, "documento.md")}>
          <Download className="h-4 w-4 mr-1" /> .md
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadText(html, "documento.html", "text/html")}>
          <Download className="h-4 w-4 mr-1" /> .html
        </Button>
        <CopyButton text={input} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
        <div className="flex flex-col rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Editor</span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-none border-0 resize-none text-sm h-full"
          />
        </div>

        <div className="flex flex-col rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</span>
          </div>
          <div
            ref={previewRef}
            className="flex-1 overflow-auto p-4 prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      <style>{`
        .prose h1,.prose h2,.prose h3 { color: hsl(var(--foreground)); margin-top:1.2em; margin-bottom:0.4em; }
        .prose p { color: hsl(var(--muted-foreground)); margin:0.6em 0; }
        .prose code { background:hsl(var(--muted)); padding:0.1em 0.4em; border-radius:3px; font-size:0.85em; }
        .prose pre { background:hsl(var(--muted)); padding:1em; border-radius:6px; overflow:auto; }
        .prose pre code { background:none; padding:0; }
        .prose table { width:100%; border-collapse:collapse; }
        .prose th,.prose td { border:1px solid hsl(var(--border)); padding:0.4em 0.8em; text-align:left; }
        .prose th { background:hsl(var(--muted)); }
        .prose blockquote { border-left:3px solid hsl(var(--primary)); padding-left:1em; color:hsl(var(--muted-foreground)); }
        .prose a { color:hsl(var(--primary)); }
        .prose li { color:hsl(var(--muted-foreground)); margin:0.2em 0; }
      `}</style>
    </ToolLayout>
  );
}
