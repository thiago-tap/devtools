"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";

export default function WebhookMockPage() {
  const endpoint = typeof window === "undefined" ? "/api/webhook-mock" : `${window.location.origin}/api/webhook-mock`;
  const [payload, setPayload] = useState('{\n  "event": "test.created",\n  "id": "evt_123"\n}');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const curl = `curl -X POST ${endpoint} -H "Content-Type: application/json" -d '${payload.replaceAll("'", "'\\''")}'`;

  const send = async () => {
    const res = await fetch("/api/webhook-mock", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    setResult(await res.json());
  };

  return (
    <ToolLayout title="Webhook Mock" description="Gere payloads, cURL e teste echo para webhooks.">
      <Panel title="Payload">
        <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="min-h-[180px] text-xs" />
        <Button className="mt-3" onClick={() => void send()}>Enviar teste</Button>
      </Panel>
      <Panel title="cURL" actions={<CopyButton text={curl} />}>
        <pre className="text-xs whitespace-pre-wrap">{curl}</pre>
      </Panel>
      {result && <Panel title="Echo"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre></Panel>}
    </ToolLayout>
  );
}
