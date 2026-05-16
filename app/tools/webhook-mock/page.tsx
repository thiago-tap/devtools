"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { Input } from "@/components/ui/input";
import { useToolHistory, type ToolHistoryItem } from "@/lib/hooks/use-tool-history";
import { generateHmac } from "@/lib/tools/hash";

type WebhookHistoryValue = {
  payload: string;
  result: Record<string, unknown> | null;
};

export default function WebhookMockPage() {
  const endpoint = typeof window === "undefined" ? "/api/webhook-mock" : `${window.location.origin}/api/webhook-mock`;
  const [payload, setPayload] = useState('{\n  "event": "test.created",\n  "id": "evt_123"\n}');
  const [secret, setSecret] = useState("");
  const [signature, setSignature] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const history = useToolHistory<WebhookHistoryValue>("webhook-mock");
  const curl = `curl -X POST ${endpoint} -H "Content-Type: application/json" -d '${payload.replaceAll("'", "'\\''")}'`;

  async function send() {
    const res = await fetch("/api/webhook-mock", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    const data = (await res.json()) as Record<string, unknown>;
    setResult(data);
    history.add("webhook test", { payload, result: data });
  }

  async function sign() {
    setSignature(await generateHmac(payload, secret, "SHA-256"));
  }

  function restoreHistoryItem(item: ToolHistoryItem<WebhookHistoryValue>) {
    setPayload(item.value.payload);
    setResult(item.value.result);
  }

  return (
    <ToolLayout title="Webhook Mock" description="Gere payloads, cURL e teste echo para webhooks.">
      <Panel title="Payload">
        <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="min-h-[180px] text-xs" />
        <Button className="mt-3" onClick={() => void send()}>Enviar teste</Button>
      </Panel>
      <Panel title="Assinatura HMAC-SHA256" actions={signature ? <CopyButton text={signature} /> : undefined}>
        <div className="flex gap-2">
          <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Webhook secret" />
          <Button onClick={() => void sign()} disabled={!secret}>Assinar</Button>
        </div>
        {signature && <code className="block mt-3 rounded bg-muted p-2 text-xs break-all">{signature}</code>}
      </Panel>
      <Panel title="cURL" actions={<CopyButton text={curl} />}>
        <pre className="text-xs whitespace-pre-wrap">{curl}</pre>
      </Panel>
      {result && <Panel title="Echo"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre></Panel>}
      {history.items.length > 0 && (
        <Panel title="Histórico local" actions={<Button size="sm" variant="outline" onClick={history.clear}>Limpar</Button>}>
          <div className="space-y-2">
            {history.items.map((item) => (
              <button key={item.id} type="button" className="block w-full rounded border p-2 text-left hover:bg-muted/40" onClick={() => restoreHistoryItem(item)}>
                <code className="text-xs">{item.value.payload.slice(0, 120)}</code>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
