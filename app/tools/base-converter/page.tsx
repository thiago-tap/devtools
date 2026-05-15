"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import {
  convertToAllBases,
  type BaseRadix,
} from "@/lib/tools/base-converter";

const BASES: { id: BaseRadix; label: string }[] = [
  { id: 2, label: "Binário (2)" },
  { id: 8, label: "Octal (8)" },
  { id: 10, label: "Decimal (10)" },
  { id: 16, label: "Hexadecimal (16)" },
];

export default function BaseConverterPage() {
  const [value, setValue] = useState("255");
  const [from, setFrom] = useState<BaseRadix>(10);

  const results = useMemo(() => {
    if (!value.trim()) return null;
    const r = convertToAllBases(value, from);
    return "error" in r ? r : r;
  }, [value, from]);

  return (
    <ToolLayout
      title="Conversor de bases"
      description="Converta números entre binário, octal, decimal e hexadecimal"
    >
      <Panel title="Entrada">
        <div className="flex flex-wrap gap-2 mb-3">
          {BASES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setFrom(b.id)}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                from === b.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 hover:bg-accent"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono"
          placeholder="Valor na base selecionada"
        />
      </Panel>

      {results && "error" in results && (
        <p className="text-sm text-destructive">{results.error}</p>
      )}

      {results && !("error" in results) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BASES.map((b) => (
            <Panel
              key={b.id}
              title={b.label}
              actions={<CopyButton text={results[b.id]} />}
            >
              <code className="font-mono text-sm break-all text-green-400">
                {results[b.id]}
              </code>
            </Panel>
          ))}
        </div>
      )}
    </ToolLayout>
  );
}
