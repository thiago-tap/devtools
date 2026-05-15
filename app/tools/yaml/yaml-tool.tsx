"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { jsonToYaml, yamlToJson } from "@/lib/tools/yaml-json";
import { AlertCircle, Loader2 } from "lucide-react";

type Mode = "yaml-to-json" | "json-to-yaml";

export default function YamlTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("yaml-to-json");
  const [loading, setLoading] = useState(false);

  const convert = async () => {
    setError("");
    setOutput("");
    if (!input.trim()) return;

    setLoading(true);
    try {
      const result = mode === "yaml-to-json" ? await yamlToJson(input) : await jsonToYaml(input);
      if (result.error) setError(result.error);
      else setOutput(result.result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="YAML ↔ JSON"
      description="Converta entre YAML e JSON para configs, Kubernetes, CI/CD e APIs"
    >
      <div className="flex gap-2 flex-wrap">
        {(
          [
            ["yaml-to-json", "YAML → JSON"],
            ["json-to-yaml", "JSON → YAML"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={mode === id ? "default" : "outline"}
            onClick={() => setMode(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Panel title="Entrada">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "yaml-to-json"
              ? "cole seu YAML aqui..."
              : 'cole seu JSON aqui: { "app": "devtools" }'
          }
          className="min-h-[200px] font-mono text-sm"
        />
        <Button onClick={convert} className="mt-3" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Convertendo...
            </>
          ) : (
            "Converter"
          )}
        </Button>
      </Panel>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {output && (
        <Panel title="Saída" actions={<CopyButton text={output} />}>
          <pre className="text-sm font-mono whitespace-pre-wrap break-all">{output}</pre>
        </Panel>
      )}
    </ToolLayout>
  );
}
