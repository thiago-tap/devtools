"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HttpStatusPage() {
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

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
      {result && <Panel title="Resultado"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre></Panel>}
    </ToolLayout>
  );
}
