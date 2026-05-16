"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SslCheckPage() {
  const [host, setHost] = useState("example.com");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

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
      {result && <Panel title="Resultado"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre></Panel>}
    </ToolLayout>
  );
}
