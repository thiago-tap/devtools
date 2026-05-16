"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Hop = { url: string; status: number; location?: string };

export default function RedirectCheckPage() {
  const [url, setUrl] = useState("https://httpbin.org/redirect/2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hops, setHops] = useState<Hop[]>([]);
  const [finalUrl, setFinalUrl] = useState("");
  const [finalStatus, setFinalStatus] = useState<number | null>(null);

  const run = async () => {
    setLoading(true);
    setError("");
    setHops([]);
    setFinalUrl("");
    setFinalStatus(null);
    try {
      const res = await fetch("/api/redirect-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        error?: string;
        hops?: Hop[];
        finalUrl?: string;
        finalStatus?: number;
      };
      if (!res.ok) {
        setError(data.error ?? res.statusText);
        if (data.hops) setHops(data.hops);
        return;
      }
      setHops(data.hops ?? []);
      setFinalUrl(data.finalUrl ?? "");
      setFinalStatus(data.finalStatus ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Cadeia de redirects"
      description="Segue redirecionamentos HTTP (HEAD) até ao destino final — útil para depurar URLs encurtadas."
    >
      <Panel title="URL">
        <div className="flex flex-wrap gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="max-w-xl font-mono text-sm" />
          <Button type="button" onClick={() => void run()} disabled={loading || !url.trim()}>
            {loading ? "…" : "Analisar"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </Panel>

      {hops.length > 0 && (
        <Panel title="Saltos">
          <ol className="list-decimal list-inside space-y-2 text-sm font-mono">
            {hops.map((h, i) => (
              <li key={i} className="break-all">
                <span className="text-muted-foreground">{h.status}</span> {h.url}
                {h.location && (
                  <span className="block text-xs text-primary mt-0.5">→ {h.location}</span>
                )}
              </li>
            ))}
          </ol>
          {finalUrl && (
            <p className="mt-4 text-sm">
              <span className="text-muted-foreground">Final:</span>{" "}
              <span className="font-mono break-all">{finalUrl}</span> ({finalStatus})
            </p>
          )}
        </Panel>
      )}
    </ToolLayout>
  );
}
