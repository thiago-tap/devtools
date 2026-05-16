"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { Badge } from "@/components/ui/badge";
import { useQueryParamState } from "@/lib/hooks/use-query-param-state";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { formatJSON, minifyJSON, jsonToTypeScript, validateJSON } from "@/lib/tools/json";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

type Mode = "format" | "minify" | "typescript";
type JsonToolResult = { result: string; error?: string };

function runJsonTool(mode: Mode, input: string, indent: number): JsonToolResult {
  switch (mode) {
    case "format":
      return formatJSON(input, indent);
    case "minify":
      return minifyJSON(input);
    case "typescript":
      return jsonToTypeScript(input);
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

function historyLabelForMode(mode: Mode): string {
  return mode === "typescript" ? "JSON TypeScript" : `JSON ${mode}`;
}

export default function JSONPage() {
  const [input, setInput] = useQueryParamState("input", "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [modeParam, setModeParam] = useQueryParamState("mode", "format");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [indent, setIndent] = useState(2);
  const history = useToolHistory<{ input: string; output: string; mode: Mode }>("json");
  const mode: Mode = modeParam === "format" || modeParam === "minify" || modeParam === "typescript" ? modeParam : "format";
  const setMode = (next: Mode) => setModeParam(next);

  const validation = input ? validateJSON(input) : null;

  const run = () => {
    setError("");
    setOutput("");
    if (!input.trim()) return;

    const result = runJsonTool(mode, input, indent);
    if (result.error) {
      setError(result.error);
      return;
    }

    setOutput(result.result);
    history.add(historyLabelForMode(mode), { input, output: result.result, mode });
  };

  const explainWithAI = async () => {
    if (!input.trim()) return;
    setAiLoading(true);
    setAiExplanation("");
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input, type: "json" }),
      });
      const data = await res.json();
      setAiExplanation(data.result || data.error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <ToolLayout title="Formatador JSON" description="Formate, valide, minifique e converta JSON para TypeScript" hasAI>
      <div className="flex gap-2 flex-wrap">
        {(["format", "minify", "typescript"] as Mode[]).map((m) => (
          <Button key={m} variant={mode === m ? "default" : "outline"} size="sm" onClick={() => setMode(m)}>
            {m === "format" ? "Formatar" : m === "minify" ? "Minificar" : "→ TypeScript"}
          </Button>
        ))}
        {mode === "format" && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-muted-foreground">Indent:</span>
            {[2, 4].map((n) => (
              <Button key={n} variant={indent === n ? "secondary" : "ghost"} size="sm" onClick={() => setIndent(n)}>
                {n}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="Input JSON"
          actions={
            <div className="flex items-center gap-2">
              {validation && (
                <Badge variant={validation.valid ? "success" : "destructive"} className="text-xs">
                  {validation.valid ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  {validation.valid ? "Válido" : "Inválido"}
                </Badge>
              )}
              <Button size="sm" onClick={run} disabled={!input.trim()}>
                Executar
              </Button>
            </div>
          }
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'{\n  "name": "DevToolbox",\n  "version": "1.0.0"\n}'}
            className="min-h-[400px] text-xs"
          />
        </Panel>

        <Panel
          title={mode === "typescript" ? "TypeScript Interface" : "Output"}
          actions={output ? <CopyButton text={output} /> : undefined}
        >
          {error ? (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
            </div>
          ) : (
            <pre className="text-xs font-mono whitespace-pre-wrap min-h-[400px] overflow-auto">
              {output || <span className="text-muted-foreground">O resultado aparecerá aqui...</span>}
            </pre>
          )}
        </Panel>
      </div>

      <Panel
        title="Explicar com AI"
        actions={
          <Button size="sm" variant="outline" onClick={explainWithAI} disabled={aiLoading || !input.trim()}>
            <Sparkles className="h-4 w-4 mr-1" />
            {aiLoading ? "Analisando..." : "Explicar estrutura"}
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground min-h-[60px]">
          {aiExplanation || "Clique em 'Explicar estrutura' para a AI descrever o JSON em português."}
        </p>
      </Panel>
      {history.items.length > 0 && (
        <Panel title="Histórico local" actions={<Button size="sm" variant="outline" onClick={history.clear}>Limpar</Button>}>
          <div className="space-y-2">
            {history.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full rounded border p-2 text-left hover:bg-muted/40"
                onClick={() => {
                  setInput(item.value.input);
                  setMode(item.value.mode);
                  setOutput(item.value.output);
                }}
              >
                <code className="text-xs">{item.label}</code>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
