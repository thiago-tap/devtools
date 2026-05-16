"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { copyToClipboard } from "@/lib/utils";
import { RefreshCw, Copy, Check } from "lucide-react";

type IdMode = "uuid-v4" | "uuid-v7" | "ulid" | "nanoid";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const NANOID = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";

function randomString(alphabet: string, length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function encodeTime(time: number, length: number): string {
  let out = "";
  for (let i = length - 1; i >= 0; i--) {
    out = CROCKFORD[time % 32] + out;
    time = Math.floor(time / 32);
  }
  return out;
}

function uuidV7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const time = Date.now();
  bytes[0] = (time / 0x10000000000) & 0xff;
  bytes[1] = (time / 0x100000000) & 0xff;
  bytes[2] = (time / 0x1000000) & 0xff;
  bytes[3] = (time / 0x10000) & 0xff;
  bytes[4] = (time / 0x100) & 0xff;
  bytes[5] = time & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function ulid(): string {
  return `${encodeTime(Date.now(), 10)}${randomString(CROCKFORD, 16)}`;
}

function createId(mode: IdMode): string {
  if (mode === "uuid-v4") return crypto.randomUUID();
  if (mode === "uuid-v7") return uuidV7();
  if (mode === "ulid") return ulid();
  return randomString(NANOID, 21);
}

export default function UUIDPage() {
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<IdMode>("uuid-v4");
  const [uuids, setUuids] = useState<string[]>(() =>
    Array.from({ length: 10 }, () => createId("uuid-v4"))
  );
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = () => setUuids(Array.from({ length: count }, () => createId(mode)));

  const copyAll = async () => {
    await copyToClipboard(uuids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <ToolLayout title="Gerador de UUID / ULID / NanoID" description="Gere UUID v4, UUID v7, ULID e NanoID criptograficamente seguros">
      <Panel title="Configurações">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(["uuid-v4", "uuid-v7", "ulid", "nanoid"] as IdMode[]).map((m) => (
              <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>
                {m.toUpperCase()}
              </Button>
            ))}
          </div>
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
        title={`${uuids.length} IDs gerados`}
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
