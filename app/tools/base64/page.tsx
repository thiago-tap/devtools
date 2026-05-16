"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { encodeBase64, decodeBase64, encodeURL, decodeURL, encodeHTML, decodeHTML } from "@/lib/tools/base64";
import { useQueryParamState } from "@/lib/hooks/use-query-param-state";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { AlertCircle } from "lucide-react";

type Mode = "base64" | "url" | "html";

export default function Base64Page() {
  const [input, setInput] = useQueryParamState("input", "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("base64");
  const history = useToolHistory<{ input: string; output: string; mode: Mode }>("base64");

  const encode = () => {
    setError(""); setOutput("");
    if (!input.trim()) return;
    const result = mode === "base64" ? encodeBase64(input) : mode === "url" ? encodeURL(input) : encodeHTML(input);
    setOutput(result);
    history.add(`${mode} encode`, { input, output: result, mode });
  };

  const decode = () => {
    setError(""); setOutput("");
    if (!input.trim()) return;
    if (mode === "base64") {
      const r = decodeBase64(input);
      if (r.error) {
        setError(r.error);
      } else {
        setOutput(r.result);
        history.add("base64 decode", { input, output: r.result, mode });
      }
    } else if (mode === "url") {
      const r = decodeURL(input);
      if (r.error) {
        setError(r.error);
      } else {
        setOutput(r.result);
        history.add("url decode", { input, output: r.result, mode });
      }
    } else {
      const result = decodeHTML(input);
      setOutput(result);
      history.add("html decode", { input, output: result, mode });
    }
  };

  return (
    <ToolLayout title="Codificador Base64 / URL / HTML" description="Codifique e decodifique Base64, URL e entidades HTML">
      <div className="flex gap-2 flex-wrap">
        {(["base64", "url", "html"] as Mode[]).map((m) => (
          <Button key={m} variant={mode === m ? "default" : "outline"} size="sm" onClick={() => setMode(m)}>
            {m === "base64" ? "Base64" : m === "url" ? "URL Encode" : "HTML Entities"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Input" actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={encode} disabled={!input.trim()}>Encode</Button>
            <Button size="sm" variant="outline" onClick={decode} disabled={!input.trim()}>Decode</Button>
          </div>
        }>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Cole o texto aqui..."
            className="min-h-[350px] text-sm"
          />
        </Panel>

        <Panel title="Output" actions={output ? <CopyButton text={output} /> : undefined}>
          {error ? (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <Textarea
              value={output}
              readOnly
              placeholder="Resultado aparecerá aqui..."
              className="min-h-[350px] text-sm"
            />
          )}
        </Panel>
      </div>
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
                  setOutput(item.value.output);
                  setMode(item.value.mode);
                }}
              >
                <span className="text-xs font-medium">{item.label}</span>
                <code className="block truncate text-xs text-muted-foreground">{item.value.input}</code>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
