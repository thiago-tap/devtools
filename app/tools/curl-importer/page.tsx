"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { parseCurl, toFetchSnippet, toHttpieSnippet } from "@/lib/tools/curl";

export default function CurlImporterPage() {
  const [input, setInput] = useState(`curl -X POST https://api.example.com/users \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Ana"}'`);
  const parsed = useMemo(() => parseCurl(input), [input]);

  return (
    <ToolLayout title="cURL Importer" description="Converta comandos curl em request, fetch e HTTPie.">
      <Panel title="Comando curl">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[180px] font-mono text-xs" />
      </Panel>
      {parsed.error && <p className="text-sm text-destructive">{parsed.error}</p>}
      {parsed.result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Request" actions={<CopyButton text={JSON.stringify(parsed.result, null, 2)} />}>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(parsed.result, null, 2)}</pre>
          </Panel>
          <Panel title="fetch" actions={<CopyButton text={toFetchSnippet(parsed.result)} />}>
            <pre className="text-xs whitespace-pre-wrap">{toFetchSnippet(parsed.result)}</pre>
          </Panel>
          <Panel title="HTTPie" actions={<CopyButton text={toHttpieSnippet(parsed.result)} />}>
            <pre className="text-xs whitespace-pre-wrap">{toHttpieSnippet(parsed.result)}</pre>
          </Panel>
        </div>
      )}
    </ToolLayout>
  );
}
