"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/tools/copy-button";
import { Loader2, AlertCircle, Search } from "lucide-react";

const DNS_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA"] as const;
type DnsType = (typeof DNS_TYPES)[number];

interface DnsRecord {
  name: string;
  type: string;
  ttl: number;
  value: string;
}

interface DnsResult {
  records?: DnsRecord[];
  error?: string;
  domain?: string;
  queryType?: string;
}

const EXAMPLES = ["google.com", "github.com", "cloudflare.com"];

export default function DnsPage() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState<DnsType>("A");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnsResult | null>(null);

  const lookup = async (domainOverride?: string, typeOverride?: DnsType) => {
    const d = domainOverride ?? domain;
    const t = typeOverride ?? recordType;
    if (!d.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: d.trim(), type: t }),
      });
      setResult(await response.json());
    } catch {
      setResult({ error: "Erro ao conectar com a API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout title="DNS Check" description="Consulte registros DNS de qualquer domínio em tempo real">
      <Panel title="Consulta">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="exemplo.com"
              className="font-mono"
            />
            <Button onClick={() => lookup()} disabled={loading || !domain.trim()}>
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />}
              <span className="ml-2">Consultar</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {DNS_TYPES.map((type) => (
              <Button
                key={type}
                variant={recordType === type ? "default" : "outline"}
                size="sm"
                className="font-mono"
                onClick={() => setRecordType(type)}
              >
                {type}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Exemplos:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="text-primary hover:underline font-mono"
                onClick={() => { setDomain(ex); lookup(ex, recordType); }}
              >
                {ex}
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

      {result?.records && (
        <Panel
          title={`${result.records.length} registro(s) ${result.queryType} para ${result.domain}`}
          actions={
            result.records.length > 0
              ? <CopyButton text={result.records.map((r) => r.value).join("\n")} />
              : undefined
          }
        >
          {result.records.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Tipo</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">TTL</th>
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Valor</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {result.records.map((record, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="font-mono text-xs">{record.type}</Badge>
                      </td>
                      <td className="py-2 px-3 font-mono text-muted-foreground text-xs">{record.ttl}s</td>
                      <td className="py-2 px-3 font-mono text-xs break-all">{record.value}</td>
                      <td className="py-2 px-3">
                        <CopyButton text={record.value} size="icon" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </ToolLayout>
  );
}
