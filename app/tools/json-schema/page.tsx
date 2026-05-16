"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { validateJsonSchema, type JsonSchema } from "@/lib/tools/json-schema-validator";

export default function JsonSchemaPage() {
  const [schemaText, setSchemaText] = useState('{\n  "type": "object",\n  "required": ["name"],\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "integer" }\n  }\n}');
  const [jsonText, setJsonText] = useState('{\n  "name": "Thiago",\n  "age": 30\n}');

  const result = useMemo(() => {
    try {
      const schema = JSON.parse(schemaText) as JsonSchema;
      const json = JSON.parse(jsonText) as unknown;
      return { ok: true, errors: validateJsonSchema(schema, json) };
    } catch (e) {
      return { ok: false, errors: [(e as Error).message] };
    }
  }, [schemaText, jsonText]);

  return (
    <ToolLayout title="JSON Schema Validator" description="Valide JSON contra um subset útil de JSON Schema no browser.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Schema">
          <Textarea value={schemaText} onChange={(e) => setSchemaText(e.target.value)} className="min-h-[360px] text-xs" />
        </Panel>
        <Panel title="JSON">
          <Textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="min-h-[360px] text-xs" />
        </Panel>
      </div>
      <Panel title="Resultado">
        {result.ok && result.errors.length === 0 ? (
          <Badge variant="success">Válido</Badge>
        ) : (
          <ul className="space-y-1 text-sm text-destructive">
            {result.errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        )}
      </Panel>
    </ToolLayout>
  );
}
