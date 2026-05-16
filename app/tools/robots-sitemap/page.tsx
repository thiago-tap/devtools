"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RobotsSitemapSummary = Record<string, unknown> & {
  robots?: { ok?: boolean };
  sitemap?: { ok?: boolean; urlCount?: number };
};

function hasRobotsSitemapSummary(result: Record<string, unknown>): result is RobotsSitemapSummary {
  return "robots" in result;
}

export default function RobotsSitemapPage() {
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const summary = result && hasRobotsSitemapSummary(result) ? result : null;

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/robots-sitemap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <ToolLayout title="Robots/Sitemap Validator" description="Verifique robots.txt e sitemap.xml de um domínio público.">
      <Panel title="Domínio ou URL">
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
          <Button onClick={() => void run()} disabled={loading || !url.trim()}>{loading ? "..." : "Validar"}</Button>
        </div>
      </Panel>
      {result && (
        <Panel title="Resultado">
          {summary && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={summary.robots?.ok ? "success" : "warning"}>robots.txt</Badge>
              <Badge variant={summary.sitemap?.ok ? "success" : "warning"}>sitemap.xml</Badge>
              <Badge variant="outline">{String(summary.sitemap?.urlCount ?? 0)} URLs</Badge>
            </div>
          )}
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </Panel>
      )}
    </ToolLayout>
  );
}
