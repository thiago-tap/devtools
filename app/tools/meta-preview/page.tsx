"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MetaPreviewPage() {
  const [url, setUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalUrl, setFinalUrl] = useState("");
  const [meta, setMeta] = useState<Record<string, string | undefined>>({});

  const run = async () => {
    setLoading(true);
    setError("");
    setMeta({});
    setFinalUrl("");
    try {
      const res = await fetch("/api/meta-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        error?: string;
        finalUrl?: string;
        meta?: Record<string, string | undefined>;
      };
      if (!res.ok) {
        setError(data.error ?? res.statusText);
        if (data.finalUrl) setFinalUrl(data.finalUrl);
        return;
      }
      setFinalUrl(data.finalUrl ?? "");
      setMeta(data.meta ?? {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Meta / Open Graph"
      description="Extrai título, descrição e og:image do HTML (primeiros ~350 KB)."
    >
      <Panel title="URL">
        <div className="flex flex-wrap gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="max-w-xl font-mono text-sm" />
          <Button type="button" onClick={() => void run()} disabled={loading || !url.trim()}>
            {loading ? "…" : "Obter"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {finalUrl && <p className="text-xs text-muted-foreground mt-2 break-all">URL final: {finalUrl}</p>}
      </Panel>

      <Panel title="Campos">
        <dl className="text-sm space-y-2">
          {(["title", "description", "image"] as const).map((k) => (
            <div key={k}>
              <dt className="text-muted-foreground capitalize">{k}</dt>
              <dd className="font-mono text-xs break-all">{meta[k] ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </ToolLayout>
  );
}
