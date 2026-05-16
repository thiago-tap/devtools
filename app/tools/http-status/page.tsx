"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type HttpStatusSummary = Record<string, unknown> & {
  finalUrl?: string;
  latencyMs?: unknown;
  ok?: boolean;
  status?: unknown;
};

function hasHttpStatusSummary(result: Record<string, unknown>): result is HttpStatusSummary {
  return "status" in result;
}

function statusMeaning(status: unknown): string {
  if (typeof status !== "number") return "";
  if (status >= 200 && status < 300) return "Sucesso";
  if (status >= 300 && status < 400) return "Redirecionamento";
  if (status >= 400 && status < 500) return "Erro do cliente";
  if (status >= 500) return "Erro do servidor";
  return "Informativo";
}

export default function HttpStatusPage() {
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const summary = result && hasHttpStatusSummary(result) ? result : null;

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/http-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <ToolLayout title="HTTP Status / Latency" description="Cheque status HTTP, latência, URL final e headers principais.">
      <Panel title="URL">
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
          <Button onClick={() => void run()} disabled={loading || !url.trim()}>{loading ? "..." : "Checar"}</Button>
        </div>
      </Panel>
      {result && (
        <Panel title="Resultado">
          {summary && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={summary.ok ? "success" : "warning"}>{String(summary.status)} {statusMeaning(summary.status)}</Badge>
              <Badge variant="outline">{String(summary.latencyMs)}ms</Badge>
              {summary.finalUrl !== url && <Badge variant="outline">redirect detectado</Badge>}
            </div>
          )}
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </Panel>
      )}
    </ToolLayout>
  );
}
