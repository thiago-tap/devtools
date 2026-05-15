"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import {
  generateSecrets,
  SECRET_PRESETS,
  type SecretEncoding,
} from "@/lib/tools/secrets";
import { formatBytes } from "@/lib/utils";
import { RefreshCw, Shield } from "lucide-react";

export default function SecretsPage() {
  const [bytes, setBytes] = useState(32);
  const [encoding, setEncoding] = useState<SecretEncoding>("base64");
  const [count, setCount] = useState(3);
  const [secrets, setSecrets] = useState<string[]>(() =>
    generateSecrets(3, 32, "base64")
  );

  const applyPreset = (presetId: string) => {
    const preset = SECRET_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setBytes(preset.bytes);
    setEncoding(preset.encoding);
    setSecrets(generateSecrets(count, preset.bytes, preset.encoding));
  };

  const regenerate = () => setSecrets(generateSecrets(count, bytes, encoding));

  const opensslHint =
    encoding === "base64"
      ? `openssl rand -base64 ${bytes}`
      : `openssl rand -hex ${bytes}`;

  return (
    <ToolLayout
      title="Gerador de Secrets"
      description="Gere chaves criptográficas aleatórias (equivalente ao openssl rand). Ideal para JWT, webhooks, sessões e purge keys."
    >
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-sm text-muted-foreground border border-primary/20">
        <Shield className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p>
          Secrets são bytes aleatórios — não confunda com{" "}
          <strong className="text-foreground">hash</strong> (digest de um texto). Tudo é
          gerado no navegador via <code className="text-xs">crypto.getRandomValues</code>;
          nada é enviado ao servidor.
        </p>
      </div>

      <Panel title="Presets (openssl)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECRET_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="text-left p-3 rounded-lg border bg-muted/30 hover:bg-accent/50 hover:border-primary/30 transition-colors"
            >
              <p className="font-medium text-sm">{preset.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
              <code className="text-[10px] text-primary mt-1 block font-mono">
                {preset.opensslCommand}
              </code>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Configuração">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">
                Bytes aleatórios: <strong className="text-foreground">{bytes}</strong>
              </label>
              <input
                type="range"
                min={8}
                max={128}
                value={bytes}
                onChange={(e) => setBytes(parseInt(e.target.value, 10))}
                className="w-full mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Saída aprox.:{" "}
                {encoding === "hex"
                  ? `${bytes * 2} caracteres hex`
                  : `~${Math.ceil((bytes * 4) / 3)} caracteres base64`}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Encoding</p>
              <div className="flex gap-2">
                {(["base64", "hex"] as const).map((enc) => (
                  <Button
                    key={enc}
                    type="button"
                    size="sm"
                    variant={encoding === enc ? "default" : "outline"}
                    onClick={() => setEncoding(enc)}
                    className="flex-1 font-mono text-xs"
                  >
                    {enc}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Quantidade: {count}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10))}
                className="w-full mt-1"
              />
            </div>

            <code className="block text-xs font-mono text-muted-foreground bg-muted/50 p-2 rounded">
              $ {opensslHint}
            </code>

            <Button onClick={regenerate} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar secrets
            </Button>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <Panel
            title="Secrets gerados"
            actions={
              secrets.length > 0 ? (
                <CopyButton text={secrets.join("\n")} />
              ) : undefined
            }
          >
            <div className="space-y-2">
              {secrets.map((secret, i) => (
                <div
                  key={`${i}-${secret.slice(0, 8)}`}
                  className="flex items-center gap-2 p-2 rounded bg-muted/50"
                >
                  <code className="font-mono text-sm flex-1 break-all">{secret}</code>
                  <CopyButton text={secret} size="icon" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Entropia: {formatBytes(bytes)} por secret · use variáveis de ambiente ou um
              secrets manager em produção
            </p>
          </Panel>
        </div>
      </div>
    </ToolLayout>
  );
}
