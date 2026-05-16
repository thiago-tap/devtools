"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { inferJsonSchema, schemaToTypeScript, schemaToZod } from "@/lib/tools/schema-infer";

export default function SchemaFromExamplesPage() {
  const [input, setInput] = useState('{"id":1,"name":"Ana","active":true}');
  const result = useMemo(() => {
    try {
      const schema = inferJsonSchema(JSON.parse(input));
      return { schema, ts: schemaToTypeScript("Generated", schema), zod: schemaToZod(schema), error: "" };
    } catch (e) {
      return { schema: null, ts: "", zod: "", error: (e as Error).message };
    }
  }, [input]);

  return (
    <ToolLayout title="Schema From Examples" description="Gere JSON Schema, TypeScript e Zod a partir de exemplos JSON.">
      <Panel title="Exemplo JSON">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[180px] font-mono text-xs" />
      </Panel>
      {result.error && <p className="text-sm text-destructive">{result.error}</p>}
      {result.schema && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="JSON Schema" actions={<CopyButton text={JSON.stringify(result.schema, null, 2)} />}><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result.schema, null, 2)}</pre></Panel>
          <Panel title="TypeScript" actions={<CopyButton text={result.ts} />}><pre className="text-xs whitespace-pre-wrap">{result.ts}</pre></Panel>
          <Panel title="Zod" actions={<CopyButton text={result.zod} />}><pre className="text-xs whitespace-pre-wrap">{result.zod}</pre></Panel>
        </div>
      )}
    </ToolLayout>
  );
}
