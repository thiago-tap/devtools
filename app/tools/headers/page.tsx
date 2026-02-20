"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { Loader2, AlertCircle, Search, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";

interface HeadersResult {
  status?: number;
  statusText?: string;
  url?: string;
  headers?: Record<string, string>;
  redirected?: boolean;
  error?: string;
}

const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "permissions-policy",
  "referrer-policy",
];

const IMPORTANT_HEADERS = [
  "content-type", "content-length", "content-encoding",
  "cache-control", "etag", "last-modified",
  "server", "x-powered-by",
  ...SECURITY_HEADERS,
  "access-control-allow-origin",
];

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-green-400";
  if (status >= 300 && status < 400) return "text-yellow-400";
  if (status >= 400 && status < 500) return "text-orange-400";
  return "text-red-400";
}

const EXAMPLES = ["https://github.com", "https://cloudflare.com", "https://vercel.com"];

export default function HeadersPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HeadersResult | null>(null);

  const inspect = async (urlOverride?: string) => {
    const target = urlOverride ?? url;
    if (!target.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/headers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.trim() }),
      });
      setResult(await response.json());
    } catch {
      setResult({ error: "Erro ao conectar com a API" });
    } finally {
      setLoading(false);
    }
  };

  const sortedHeaders = result?.headers
    ? Object.entries(result.headers).sort(([a], [b]) => {
        const ai = IMPORTANT_HEADERS.indexOf(a);
        const bi = IMPORTANT_HEADERS.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      })
    : [];

  const presentSecurity = result?.headers
    ? SECURITY_HEADERS.filter((h) => h in (result.headers ?? {}))
    : [];
  const missingSecurity = result?.headers
    ? SECURITY_HEADERS.filter((h) => !(h in (result.headers ?? {})))
    : [];

  return (
    <ToolLayout title="HTTP Headers Inspector" description="Inspecione os headers de resposta HTTP de qualquer URL">
      <Panel title="URL">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && inspect()}
              placeholder="https://exemplo.com"
              className="font-mono"
            />
            <Button onClick={() => inspect()} disabled={loading || !url.trim()}>
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />}
              <span className="ml-2">Inspecionar</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Exemplos:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="text-primary hover:underline font-mono"
                onClick={() => { setUrl(ex); inspect(ex); }}
              >
                {ex.replace("https://", "")}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {result?.error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{result.error}</p>
        </div>
      )}

      {result?.status && (
        <>
          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-6 p-4 rounded-lg border bg-card">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
              <p className={`text-2xl font-bold font-mono ${getStatusColor(result.status)}`}>
                {result.status} <span className="text-base font-normal text-foreground">{result.statusText}</span>
              </p>
            </div>
            {result.redirected && result.url && (
              <div className="flex-1 border-l pl-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">URL final (após redirect)</p>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {result.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Security summary */}
          {result.headers && (
            <Panel title="Segurança">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presentSecurity.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs text-green-400">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <code className="font-mono">{h}</code>
                  </div>
                ))}
                {missingSecurity.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-orange-400/60" />
                    <code className="font-mono line-through opacity-50">{h}</code>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* All headers */}
          <Panel
            title={`${sortedHeaders.length} headers`}
            actions={
              sortedHeaders.length > 0
                ? <CopyButton text={sortedHeaders.map(([k, v]) => `${k}: ${v}`).join("\n")} />
                : undefined
            }
          >
            <div className="space-y-1">
              {sortedHeaders.map(([key, value]) => (
                <div
                  key={key}
                  className={`flex gap-3 p-2 rounded text-sm group ${IMPORTANT_HEADERS.includes(key) ? "bg-muted/30" : ""}`}
                >
                  <span className="font-mono text-blue-400 shrink-0 w-56 truncate text-xs pt-0.5">{key}</span>
                  <span className="font-mono text-xs break-all flex-1">{value}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CopyButton text={value} size="icon" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </ToolLayout>
  );
}
