"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { Badge } from "@/components/ui/badge";

const DEFAULT_CSP = "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

function analyze(csp: string): string[] {
  const warnings: string[] = [];
  if (!/default-src/i.test(csp)) warnings.push("Inclua default-src como fallback.");
  if (/unsafe-inline/i.test(csp)) warnings.push("Evite 'unsafe-inline' em script/style quando possível.");
  if (/unsafe-eval/i.test(csp)) warnings.push("Evite 'unsafe-eval'.");
  if (!/object-src\s+'none'/i.test(csp)) warnings.push("Recomendado: object-src 'none'.");
  if (!/frame-ancestors/i.test(csp)) warnings.push("Considere frame-ancestors para reduzir clickjacking.");
  return warnings;
}

export default function CspPage() {
  const [csp, setCsp] = useState(DEFAULT_CSP);
  const [imgSrc, setImgSrc] = useState("'self' data: https:");
  const built = `${DEFAULT_CSP}; img-src ${imgSrc}; upgrade-insecure-requests`;
  const warnings = useMemo(() => analyze(csp), [csp]);

  return (
    <ToolLayout title="CSP Builder / Analyzer" description="Monte e revise Content-Security-Policy com avisos práticos.">
      <Panel title="Builder rápido" actions={<CopyButton text={built} />}>
        <label className="text-xs text-muted-foreground">img-src</label>
        <Input value={imgSrc} onChange={(e) => setImgSrc(e.target.value)} className="font-mono mt-1" />
        <pre className="mt-3 rounded bg-muted p-3 text-xs whitespace-pre-wrap">{built}</pre>
      </Panel>
      <Panel title="Analyzer" actions={<CopyButton text={csp} />}>
        <Textarea value={csp} onChange={(e) => setCsp(e.target.value)} className="min-h-[160px] text-xs" />
        <div className="mt-3 space-y-2">
          <Badge variant={warnings.length ? "warning" : "success"}>{warnings.length ? "Atenção" : "Boa base"}</Badge>
          {warnings.map((warning) => <p key={warning} className="text-sm text-muted-foreground">{warning}</p>)}
        </div>
      </Panel>
    </ToolLayout>
  );
}
