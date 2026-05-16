"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";

const CHECKS = [
  { id: "http", label: "HTTP status e latência", api: "/api/http-status" },
  { id: "headers", label: "Headers HTTP", api: "/api/headers" },
  { id: "robots", label: "Robots e Sitemap", api: "/api/robots-sitemap" },
  { id: "cors", label: "CORS", api: "/api/cors-probe" },
  { id: "redirect", label: "Redirect chain", api: "/api/redirect-chain" },
];

export default function DeployChecklistPage() {
  const [url, setUrl] = useState("https://example.com");
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState("");

  async function run() {
    setLoading(true);
    try {
      const settled = await Promise.allSettled(CHECKS.map(async (check) => {
        const response = await fetch(check.api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(check.id === "cors" ? { url, origin: "*" } : { url }),
        });
        return [check.id, await response.json()] as const;
      }));
      const entries = settled.map((item, index) => {
        if (item.status === "fulfilled") return item.value;
        return [CHECKS[index].id, { error: item.reason instanceof Error ? item.reason.message : "Falha ao rodar check" }] as const;
      });
      setResults(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  }

  async function summarize() {
    setSummarizing(true);
    try {
      const response = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "checklist de deploy", input: JSON.stringify(results, null, 2) }),
      });
      const data = await response.json();
      setSummary(data.result ?? data.error ?? "");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <ToolLayout title="Deploy Checklist" description="Agregue status, headers, robots/sitemap, CORS e redirects antes do deploy." hasAI>
      <Panel title="URL pública">
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
          <Button onClick={() => void run()} disabled={loading || !url.trim()}>{loading ? "Rodando..." : "Rodar checks"}</Button>
        </div>
      </Panel>
      {Object.keys(results).length > 0 && (
        <Panel title="Resultados" actions={<CopyButton text={JSON.stringify(results, null, 2)} />}>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
          <Button className="mt-3" variant="outline" onClick={() => void summarize()} disabled={summarizing}>
            {summarizing ? "Resumindo..." : "Resumir riscos com IA"}
          </Button>
        </Panel>
      )}
      {summary && <Panel title="Resumo IA"><p className="text-sm whitespace-pre-wrap">{summary}</p></Panel>}
    </ToolLayout>
  );
}
