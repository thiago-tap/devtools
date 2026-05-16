"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CorsProbePage() {
  const [url, setUrl] = useState("https://api.github.com");
  const [origin, setOrigin] = useState("https://devtools.catiteo.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/cors-probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, origin }),
      });
      const data = (await res.json()) as Record<string, unknown> & { error?: string };
      if (!res.ok) {
        setError((data.error as string) ?? res.statusText);
        return;
      }
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Sonda CORS"
      description="HEAD com cabeçalho Origin — indício de Access-Control-Allow-* (não substitui o browser)."
    >
      <Panel title="Pedido">
        <div className="space-y-3 max-w-xl">
          <div>
            <label className="text-xs text-muted-foreground">URL do recurso</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Origin</label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} className="font-mono text-sm" />
          </div>
          <Button type="button" onClick={() => void run()} disabled={loading || !url.trim()}>
            {loading ? "…" : "Sondar"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </Panel>

      {result && (
        <Panel title="Resposta">
          <pre className="text-xs font-mono whitespace-pre-wrap break-all rounded-md bg-muted p-3 overflow-auto max-h-[400px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Panel>
      )}
    </ToolLayout>
  );
}
