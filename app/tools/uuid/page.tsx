"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { copyToClipboard } from "@/lib/utils";
import { RefreshCw, Copy, Check } from "lucide-react";

export default function UUIDPage() {
  const [count, setCount] = useState(10);
  const [uuids, setUuids] = useState<string[]>(() =>
    Array.from({ length: 10 }, () => crypto.randomUUID())
  );
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = () => setUuids(Array.from({ length: count }, () => crypto.randomUUID()));

  const copyAll = async () => {
    await copyToClipboard(uuids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <ToolLayout title="Gerador de UUID" description="Gere UUIDs v4 criptograficamente seguros">
      <Panel title="Configurações">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Quantidade:</label>
            <input
              type="number" min={1} max={100} value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-20 h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <Button onClick={generate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar
          </Button>
        </div>
      </Panel>

      <Panel
        title={`${uuids.length} UUIDs gerados`}
        actions={
          <Button variant="outline" size="sm" onClick={copyAll}>
            {copiedAll ? <Check className="h-4 w-4 mr-1 text-green-400" /> : <Copy className="h-4 w-4 mr-1" />}
            {copiedAll ? "Copiado!" : "Copiar todos"}
          </Button>
        }
      >
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
          {uuids.map((uuid, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group">
              <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
              <code className="font-mono text-sm flex-1">{uuid}</code>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={uuid} size="icon" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </ToolLayout>
  );
}
