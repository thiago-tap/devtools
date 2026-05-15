"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { formatEnv, maskEnvSecrets, parseEnvLines } from "@/lib/tools/env-formatter";
import { AlertCircle } from "lucide-react";

export default function EnvPage() {
  const [input, setInput] = useState(`DATABASE_URL=postgres://localhost:5432/app
API_KEY=changeme
DEBUG=true`);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [sortKeys, setSortKeys] = useState(false);

  const parsed = input.trim() ? parseEnvLines(input) : { lines: [], errors: [] };

  const runFormat = () => {
    const { result, errors: fmtErrors } = formatEnv(input, sortKeys);
    setOutput(result);
    setErrors(fmtErrors);
  };

  const runMask = () => {
    setOutput(maskEnvSecrets(input));
    setErrors([]);
  };

  return (
    <ToolLayout
      title="Formatador .env"
      description="Valide, ordene e mascare variáveis de ambiente — útil antes de commitar ou compartilhar"
    >
      <Panel title="Arquivo .env">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[180px] font-mono text-sm"
          placeholder="KEY=value"
        />
        <div className="flex flex-wrap gap-2 mt-3 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
              className="rounded"
            />
            Ordenar chaves (A-Z)
          </label>
          <Button size="sm" onClick={runFormat}>
            Formatar
          </Button>
          <Button size="sm" variant="outline" onClick={runMask}>
            Mascarar secrets
          </Button>
        </div>
      </Panel>

      {parsed.errors.length > 0 && (
        <div className="space-y-1">
          {parsed.errors.map((err) => (
            <div key={err} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {err}
            </div>
          ))}
        </div>
      )}

      {parsed.lines.length > 0 && (
        <Panel title={`${parsed.lines.length} variáveis detectadas`}>
          <ul className="text-sm font-mono space-y-1 max-h-40 overflow-auto">
            {parsed.lines.map((l) => (
              <li key={`${l.lineNumber}-${l.key}`} className="text-muted-foreground">
                <span className="text-foreground">{l.key}</span>
                <span className="opacity-50">=</span>
                <span>
                  {l.value.slice(0, 40)}
                  {l.value.length > 40 ? "…" : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {errors.length > 0 && (
        <p className="text-sm text-destructive">{errors.join("; ")}</p>
      )}

      {output && (
        <Panel title="Resultado" actions={<CopyButton text={output} />}>
          <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
        </Panel>
      )}
    </ToolLayout>
  );
}
