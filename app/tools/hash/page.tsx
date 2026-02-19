"use client";
import { useState, useEffect } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { generateHash, md5 } from "@/lib/tools/hash";

const ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-512"] as const;

export default function HashPage() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!input) { setHashes({}); return; }
    const compute = async () => {
      const results: Record<string, string> = {};
      results["MD5"] = md5(input);
      for (const algo of ["SHA-1", "SHA-256", "SHA-512"] as const) {
        results[algo] = await generateHash(input, algo);
      }
      setHashes(results);
    };
    compute();
  }, [input]);

  return (
    <ToolLayout title="Gerador de Hash" description="Gere hashes MD5, SHA-1, SHA-256 e SHA-512 instantaneamente">
      <Panel title="Texto de entrada">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite ou cole o texto para gerar os hashes..."
          className="min-h-[120px]"
        />
      </Panel>

      <div className="grid grid-cols-1 gap-3">
        {ALGORITHMS.map((algo) => (
          <Panel
            key={algo}
            title={algo}
            actions={hashes[algo] ? <CopyButton text={hashes[algo]} /> : undefined}
          >
            <code className="text-sm font-mono break-all text-green-400">
              {hashes[algo] || <span className="text-muted-foreground">Digite algo para gerar o hash...</span>}
            </code>
          </Panel>
        ))}
      </div>
    </ToolLayout>
  );
}
