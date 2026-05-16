"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/tools/copy-button";
import { formatLogLines, parseLogLines } from "@/lib/tools/logs";

export default function LogsPage() {
  const [input, setInput] = useState('{"level":"error","timestamp":"2026-05-16T20:00:00Z","message":"Falha"}\ninfo server started');
  const [query, setQuery] = useState("");
  const lines = useMemo(() => parseLogLines(input), [input]);
  const output = useMemo(() => formatLogLines(lines, query), [lines, query]);

  return (
    <ToolLayout title="Logs Toolkit" description="Formate JSON/NDJSON, filtre logs e destaque níveis.">
      <Panel title="Logs">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[220px] font-mono text-xs" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar texto" className="mt-3" />
      </Panel>
      <Panel title="Resumo">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{lines.length} linha(s)</Badge>
          {["error", "warn", "info", "debug"].map((level) => (
            <Badge key={level} variant="outline">{level}: {lines.filter((line) => line.level?.toLowerCase() === level).length}</Badge>
          ))}
        </div>
      </Panel>
      <Panel title="Resultado filtrado" actions={<CopyButton text={output} />}>
        <pre className="text-xs whitespace-pre-wrap">{output}</pre>
      </Panel>
    </ToolLayout>
  );
}
