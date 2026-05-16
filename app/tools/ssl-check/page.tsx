"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SslSummary = {
  authorized?: boolean;
  daysToExpire?: number;
  expired?: boolean;
  expiresSoon?: boolean;
  protocol?: unknown;
};

function hasSslSummary(result: Record<string, unknown>): result is Record<string, unknown> & SslSummary {
  return "daysToExpire" in result;
}

function expiryBadgeVariant(summary: SslSummary): "destructive" | "warning" | "outline" {
  if (summary.expired) return "destructive";
  if (summary.expiresSoon) return "warning";
  return "outline";
}

export default function SslCheckPage() {
  const [host, setHost] = useState("example.com");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const summary = result && hasSslSummary(result) ? result : null;

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/ssl-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ host }) });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <ToolLayout title="SSL/TLS Checker" description="Inspecione certificado TLS, emissor, validade e protocolo.">
      <Panel title="Host">
        <div className="flex gap-2">
          <Input value={host} onChange={(e) => setHost(e.target.value)} className="font-mono" />
          <Button onClick={() => void run()} disabled={loading || !host.trim()}>{loading ? "..." : "Checar"}</Button>
        </div>
      </Panel>
      {result && (
        <Panel title="Resultado">
          {summary && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={summary.authorized ? "success" : "destructive"}>{summary.authorized ? "Autorizado" : "Não autorizado"}</Badge>
              <Badge variant={expiryBadgeVariant(summary)}>
                {String(summary.daysToExpire)} dia(s) até expirar
              </Badge>
              <Badge variant="outline">{String(summary.protocol)}</Badge>
            </div>
          )}
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </Panel>
      )}
    </ToolLayout>
  );
}
