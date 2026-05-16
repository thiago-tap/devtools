"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";

type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[]; items?: Schema };

function tsType(schema: Schema): string {
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "array") return `${tsType(schema.items ?? {})}[]`;
  if (schema.type === "object" && schema.properties) {
    return `{\n${Object.entries(schema.properties).map(([k, v]) => `  ${k}${schema.required?.includes(k) ? "" : "?"}: ${tsType(v)};`).join("\n")}\n}`;
  }
  return "string";
}

function zodType(schema: Schema): string {
  if (schema.type === "integer") return "z.number().int()";
  if (schema.type === "number") return "z.number()";
  if (schema.type === "boolean") return "z.boolean()";
  if (schema.type === "array") return `z.array(${zodType(schema.items ?? {})})`;
  if (schema.type === "object" && schema.properties) {
    return `z.object({\n${Object.entries(schema.properties).map(([k, v]) => `  ${k}: ${zodType(v)}${schema.required?.includes(k) ? "" : ".optional()"},`).join("\n")}\n})`;
  }
  return "z.string()";
}

export default function ZodSchemaPage() {
  const [schemaText, setSchemaText] = useState('{\n  "type": "object",\n  "required": ["name"],\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "integer" }\n  }\n}');
  const result = useMemo(() => {
    try {
      const schema = JSON.parse(schemaText) as Schema;
      return {
        error: "",
        ts: `export type Generated = ${tsType(schema)};`,
        zod: `import { z } from "zod";\n\nexport const generatedSchema = ${zodType(schema)};`,
      };
    } catch (e) {
      return { error: (e as Error).message, ts: "", zod: "" };
    }
  }, [schemaText]);

  return (
    <ToolLayout title="Zod / TypeScript / Schema" description="Gere TypeScript e esboços Zod a partir de JSON Schema simples.">
      <Panel title="JSON Schema">
        <Textarea value={schemaText} onChange={(e) => setSchemaText(e.target.value)} className="min-h-[260px] text-xs" />
      </Panel>
      {result.error ? <p className="text-sm text-destructive">{result.error}</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="TypeScript" actions={<CopyButton text={result.ts} />}><pre className="text-xs whitespace-pre-wrap">{result.ts}</pre></Panel>
          <Panel title="Zod" actions={<CopyButton text={result.zod} />}><pre className="text-xs whitespace-pre-wrap">{result.zod}</pre></Panel>
        </div>
      )}
    </ToolLayout>
  );
}
