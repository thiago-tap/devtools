"use client";
import { useState, useMemo } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const COMMON_PATTERNS = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
  { name: "URL", pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)" },
  { name: "CPF", pattern: "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}" },
  { name: "CNPJ", pattern: "\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}-\\d{2}" },
  { name: "CEP", pattern: "\\d{5}-?\\d{3}" },
  { name: "Telefone BR", pattern: "(\\+55)?\\s?(\\(\\d{2}\\)|\\d{2})\\s?\\d{4,5}-?\\d{4}" },
  { name: "IPv4", pattern: "((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)" },
  { name: "Hex Color", pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})" },
];

export default function RegexPage() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("gm");
  const [testString, setTestString] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const result = useMemo(() => {
    if (!pattern || !testString) return null;
    try {
      const regex = new RegExp(pattern, flags);
      const matches: { match: string; index: number; groups: Record<string, string> | null }[] = [];
      let m: RegExpExecArray | null;
      const r = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      while ((m = r.exec(testString)) !== null) {
        matches.push({ match: m[0], index: m.index, groups: m.groups ?? null });
        if (!flags.includes("g")) break;
      }
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: (e as Error).message };
    }
  }, [pattern, flags, testString]);

  const highlightedText = useMemo(() => {
    if (!result?.matches.length || !testString) return testString;
    let lastIndex = 0;
    const parts: { text: string; isMatch: boolean }[] = [];
    result.matches.forEach(({ match, index }) => {
      if (index > lastIndex) parts.push({ text: testString.slice(lastIndex, index), isMatch: false });
      parts.push({ text: match, isMatch: true });
      lastIndex = index + match.length;
    });
    if (lastIndex < testString.length) parts.push({ text: testString.slice(lastIndex), isMatch: false });
    return parts;
  }, [result, testString]);

  const explainWithAI = async () => {
    if (!pattern) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pattern, type: "regex" }),
      });
      const data = await res.json();
      setAiExplanation(data.result || data.error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <ToolLayout title="Testador de Regex" description="Teste expressões regulares com highlighting e explicação por IA" hasAI>
      {/* Pattern input */}
      <Panel title="Expressão Regular">
        <div className="flex gap-2">
          <span className="text-muted-foreground text-sm pt-2">/</span>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="[a-z]+"
            className="font-mono flex-1"
          />
          <span className="text-muted-foreground text-sm pt-2">/</span>
          <Input
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="font-mono w-20"
            placeholder="gm"
          />
          <Button variant="outline" size="sm" onClick={explainWithAI} disabled={aiLoading || !pattern}>
            <Sparkles className="h-4 w-4 mr-1" />
            {aiLoading ? "..." : "Explicar"}
          </Button>
        </div>
        {result?.error && (
          <p className="text-destructive text-xs mt-2 font-mono">{result.error}</p>
        )}
        {aiExplanation && (
          <div className="mt-3 p-3 rounded-md bg-muted text-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Explicação AI:</p>
            <p>{aiExplanation}</p>
          </div>
        )}
      </Panel>

      {/* Common patterns */}
      <div className="flex flex-wrap gap-2">
        {COMMON_PATTERNS.map((p) => (
          <Button key={p.name} variant="outline" size="sm" onClick={() => setPattern(p.pattern)}>
            {p.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Texto de Teste">
          <Textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Cole o texto para testar aqui..."
            className="min-h-[300px] text-sm"
          />
        </Panel>

        <Panel
          title="Resultado"
          actions={result?.matches.length ? (
            <Badge variant="success">{result.matches.length} match{result.matches.length !== 1 ? "es" : ""}</Badge>
          ) : undefined}
        >
          {typeof highlightedText === "string" ? (
            <p className="text-sm text-muted-foreground min-h-[300px]">{highlightedText || "Sem resultado"}</p>
          ) : (
            <div className="font-mono text-sm min-h-[300px] whitespace-pre-wrap break-all leading-relaxed">
              {highlightedText.map((part, i) =>
                part.isMatch ? (
                  <mark key={i} className="bg-yellow-400/30 text-yellow-300 rounded px-0.5">{part.text}</mark>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          )}

          {result?.matches.length ? (
            <div className="mt-4 border-t pt-3 space-y-1">
              <p className="text-xs text-muted-foreground mb-2">Matches encontrados:</p>
              {result.matches.slice(0, 20).map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono">{i + 1}</Badge>
                  <code className="bg-muted px-1.5 py-0.5 rounded">{m.match}</code>
                  <span className="text-muted-foreground">índice {m.index}</span>
                </div>
              ))}
              {result.matches.length > 20 && (
                <p className="text-xs text-muted-foreground">+{result.matches.length - 20} mais...</p>
              )}
            </div>
          ) : null}
        </Panel>
      </div>
    </ToolLayout>
  );
}
