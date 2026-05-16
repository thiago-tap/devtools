"use client";

import { useMemo } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { slugify } from "@/lib/tools/slug";
import { useQueryParamState } from "@/lib/hooks/use-query-param-state";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import { Button } from "@/components/ui/button";

export default function SlugPage() {
  const [input, setInput] = useQueryParamState("input", "Meu Título Incrível 2026!");
  const history = useToolHistory<{ input: string; output: string }>("slug");
  const out = useMemo(() => slugify(input), [input]);

  return (
    <ToolLayout
      title="Slug / URL amigável"
      description="Normaliza texto para slugs (minúsculas, hífens, sem acentos)."
    >
      <Panel
        title="Texto"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => history.add("slug", { input, output: out })}>
              Guardar
            </Button>
            <CopyButton text={out} />
          </div>
        }
      >
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[100px]" />
        <p className="text-xs text-muted-foreground mt-2">Resultado</p>
        <code className="block mt-1 p-3 rounded-md bg-muted font-mono text-sm break-all">{out}</code>
      </Panel>
      {history.items.length > 0 && (
        <Panel title="Histórico local" actions={<Button size="sm" variant="outline" onClick={history.clear}>Limpar</Button>}>
          <div className="space-y-2">
            {history.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full rounded border p-2 text-left hover:bg-muted/40"
                onClick={() => setInput(item.value.input)}
              >
                <code className="text-xs">{item.value.output}</code>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
