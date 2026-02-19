"use client";
import { useState, useMemo } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { diffLines, diffWords, type Change } from "diff";
import { Button } from "@/components/ui/button";

type DiffMode = "lines" | "words";

export default function DiffPage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [mode, setMode] = useState<DiffMode>("lines");

  const changes = useMemo(() => {
    if (!left && !right) return [];
    return mode === "lines" ? diffLines(left, right) : diffWords(left, right);
  }, [left, right, mode]);

  const added = changes.filter((c) => c.added).reduce((a, c) => a + (c.count ?? 0), 0);
  const removed = changes.filter((c) => c.removed).reduce((a, c) => a + (c.count ?? 0), 0);

  return (
    <ToolLayout title="Comparador de Texto" description="Compare dois textos e visualize as diferenças com highlighting">
      <div className="flex items-center gap-3">
        {(["lines", "words"] as DiffMode[]).map((m) => (
          <Button key={m} variant={mode === m ? "default" : "outline"} size="sm" onClick={() => setMode(m)}>
            {m === "lines" ? "Por linha" : "Por palavra"}
          </Button>
        ))}
        {(added > 0 || removed > 0) && (
          <div className="flex gap-2 ml-2">
            <Badge variant="success">+{added} adicionado(s)</Badge>
            <Badge variant="destructive">-{removed} removido(s)</Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Texto Original">
          <Textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Cole o texto original aqui..."
            className="min-h-[300px] text-sm"
          />
        </Panel>
        <Panel title="Texto Modificado">
          <Textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Cole o texto modificado aqui..."
            className="min-h-[300px] text-sm"
          />
        </Panel>
      </div>

      {changes.length > 0 && (
        <Panel title="Diferenças">
          <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-[500px]">
            {changes.map((change: Change, i: number) => (
              <span
                key={i}
                className={
                  change.added ? "bg-green-500/20 text-green-300" :
                  change.removed ? "bg-red-500/20 text-red-300 line-through" :
                  "text-muted-foreground"
                }
              >
                {change.value}
              </span>
            ))}
          </pre>
        </Panel>
      )}
    </ToolLayout>
  );
}
