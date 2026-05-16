"use client";

import { useMemo, useState } from "react";
import { faker } from "@faker-js/faker";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";

export default function LoremPage() {
  const [seed, setSeed] = useState("42");
  const [paragraphs, setParagraphs] = useState(3);

  const text = useMemo(() => {
    const n = Number(seed);
    faker.seed(Number.isFinite(n) ? n : 42);
    return faker.lorem.paragraphs(Math.min(20, Math.max(1, paragraphs)));
  }, [seed, paragraphs]);

  return (
    <ToolLayout
      title="Lorem / dados de exemplo"
      description="Texto Lorem e dados fictícios com seed reproduzível (@faker-js/faker)."
    >
      <Panel title="Opções" actions={<CopyButton text={text} />}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Seed (número)</label>
            <Input value={seed} onChange={(e) => setSeed(e.target.value)} className="w-32 font-mono" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Parágrafos (1–20)</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={paragraphs}
              onChange={(e) => setParagraphs(Number(e.target.value) || 1)}
              className="w-24"
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setSeed(String(Date.now()))}>
            Seed aleatório
          </Button>
        </div>
      </Panel>
      <Panel title="Texto">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
      </Panel>
    </ToolLayout>
  );
}
