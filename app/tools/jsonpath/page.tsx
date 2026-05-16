"use client";

import { useMemo, useState } from "react";
import { JSONPath } from "jsonpath-plus";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";

export default function JsonPathPage() {
  const [path, setPath] = useState("$.store.book[*].title");
  const [jsonText, setJsonText] = useState(
    JSON.stringify(
      {
        store: {
          book: [
            { category: "fiction", title: "Book A", price: 8.99 },
            { category: "reference", title: "Book B", price: 12.99 },
          ],
        },
      },
      null,
      2,
    ),
  );
  const result = useMemo(() => {
    try {
      const data = JSON.parse(jsonText) as object;
      const matches = JSONPath({ path, json: data, wrap: false });
      return { ok: true as const, value: matches };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [path, jsonText]);

  const outStr = result.ok ? JSON.stringify(result.value, null, 2) : result.error;

  return (
    <ToolLayout
      title="JSONPath"
      description="Consulte JSON com expressões JSONPath (jsonpath-plus)."
    >
      <Panel title="Expressão" actions={result.ok ? <CopyButton text={outStr} /> : null}>
        <Input value={path} onChange={(e) => setPath(e.target.value)} className="font-mono" placeholder="$.path" />
      </Panel>
      <Panel title="JSON">
        <Textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="min-h-[200px] font-mono text-sm" />
      </Panel>
      <Panel title="Resultado">
        <pre className="text-xs font-mono whitespace-pre-wrap break-all rounded-md bg-muted p-3 max-h-[400px] overflow-auto">
          {outStr}
        </pre>
      </Panel>
    </ToolLayout>
  );
}
