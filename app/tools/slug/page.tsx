"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { slugify } from "@/lib/tools/slug";

export default function SlugPage() {
  const [input, setInput] = useState("Meu Título Incrível 2026!");
  const out = useMemo(() => slugify(input), [input]);

  return (
    <ToolLayout
      title="Slug / URL amigável"
      description="Normaliza texto para slugs (minúsculas, hífens, sem acentos)."
    >
      <Panel title="Texto" actions={<CopyButton text={out} />}>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[100px]" />
        <p className="text-xs text-muted-foreground mt-2">Resultado</p>
        <code className="block mt-1 p-3 rounded-md bg-muted font-mono text-sm break-all">{out}</code>
      </Panel>
    </ToolLayout>
  );
}
