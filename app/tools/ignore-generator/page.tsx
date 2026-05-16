"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { generateIgnoreFile, listIgnorePresets } from "@/lib/tools/ignore-generator";

export default function IgnoreGeneratorPage() {
  const presets = listIgnorePresets();
  const [selected, setSelected] = useState(["Next.js", "Node", "OS"]);
  const output = useMemo(() => generateIgnoreFile(selected), [selected]);

  function togglePreset(preset: string): void {
    setSelected((current) =>
      current.includes(preset)
        ? current.filter((item) => item !== preset)
        : [...current, preset],
    );
  }

  return (
    <ToolLayout title="Ignore Generator" description="Gere .gitignore, .dockerignore e .npmignore por stack.">
      <Panel title="Presets">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset}
              variant={selected.includes(preset) ? "default" : "outline"}
              size="sm"
              onClick={() => togglePreset(preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
      </Panel>
      <Panel title=".gitignore" actions={<CopyButton text={output} />}>
        <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
      </Panel>
    </ToolLayout>
  );
}
