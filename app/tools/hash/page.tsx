"use client";

import { useEffect, useRef, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import {
  computeAllDigests,
  computeDigestsFromFile,
  DIGEST_ALGORITHMS,
  EXTENDED_DIGEST_ALGORITHMS,
  generateHmac,
  HMAC_ALGORITHMS,
  timingSafeEqual,
  type AllDigestAlgorithm,
  type ExtendedDigestAlgorithm,
  type HmacAlgorithm,
  type WebCryptoDigest,
} from "@/lib/tools/hash";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { formatBytes } from "@/lib/utils";
import { AlertTriangle, Check, FileUp, X } from "lucide-react";

type Tab = "digest" | "hmac" | "compare";

export default function HashPage() {
  const [tab, setTab] = useState<Tab>("digest");
  const [input, setInput] = useState("");
  const [secret, setSecret] = useState("");
  const [uppercase, setUppercase] = useState(false);
  const [hashes, setHashes] = useState<Partial<Record<AllDigestAlgorithm, string>>>({});
  const [fileDigests, setFileDigests] = useState<{
    web: Partial<Record<WebCryptoDigest, string>>;
    extended: Partial<Record<ExtendedDigestAlgorithm, string>>;
  } | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hmacAlgo, setHmacAlgo] = useState<HmacAlgorithm>("SHA-256");
  const [hmacResult, setHmacResult] = useState("");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const debouncedInput = useDebouncedValue(input, 250);
  const debouncedSecret = useDebouncedValue(secret, 250);

  useEffect(() => {
    if (!debouncedInput.trim() || fileInfo) {
      setHashes({});
      return;
    }
    computeAllDigests(debouncedInput, uppercase).then(setHashes);
  }, [debouncedInput, uppercase, fileInfo]);

  useEffect(() => {
    if (tab !== "hmac" || !debouncedInput.trim() || !debouncedSecret) {
      setHmacResult("");
      return;
    }
    generateHmac(debouncedInput, debouncedSecret, hmacAlgo, uppercase).then(setHmacResult);
  }, [tab, debouncedInput, debouncedSecret, hmacAlgo, uppercase]);

  useEffect(() => {
    if (!selectedFile) return;
    computeDigestsFromFile(selectedFile, uppercase).then(setFileDigests);
  }, [selectedFile, uppercase]);

  const onFile = (file: File | null) => {
    if (!file) {
      setFileInfo(null);
      setSelectedFile(null);
      setFileDigests(null);
      return;
    }
    setInput("");
    setSelectedFile(file);
    setFileInfo({ name: file.name, size: file.size });
  };

  const clearFile = () => {
    setFileInfo(null);
    setSelectedFile(null);
    setFileDigests(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const digestPanels = [
    ...DIGEST_ALGORITHMS.map((a) => ({ ...a })),
    ...EXTENDED_DIGEST_ALGORITHMS.map((a) => ({
      ...a,
      warning: undefined as string | undefined,
      legacy: undefined as boolean | undefined,
    })),
  ];

  const getDigestValue = (id: AllDigestAlgorithm): string | undefined => {
    if (fileInfo) {
      if (id === "MD5") return undefined;
      if (id === "SHA3-256" || id === "SHA3-512" || id === "BLAKE2b") {
        return fileDigests?.extended[id];
      }
      return fileDigests?.web[id as WebCryptoDigest];
    }
    return hashes[id];
  };

  const compareMatch =
    compareA.trim() && compareB.trim()
      ? timingSafeEqual(compareA.trim(), compareB.trim())
      : null;

  return (
    <ToolLayout
      title="Gerador de Hash"
      description="Digest MD5/SHA-2/SHA-3/BLAKE2b, HMAC para webhooks e comparação timing-safe — tudo no navegador."
    >
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["digest", "Digest"],
            ["hmac", "HMAC"],
            ["compare", "Comparar"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="rounded"
          />
          HEX maiúsculo
        </label>
      </div>

      {tab === "digest" && (
        <>
          <Panel
            title="Entrada"
            actions={
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="h-3 w-3 mr-1" />
                  Arquivo
                </Button>
                {fileInfo && (
                  <Button size="sm" variant="ghost" onClick={clearFile}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            }
          >
            {fileInfo ? (
              <div className="text-sm">
                <p className="font-medium">{fileInfo.name}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {formatBytes(fileInfo.size)} · SHA-2/SHA-3/BLAKE2b (MD5 só para texto)
                </p>
              </div>
            ) : (
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite ou cole o texto para gerar os hashes..."
                className="min-h-[120px] font-mono text-sm"
              />
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-3">
            {digestPanels.map((algo) => {
              const value = getDigestValue(algo.id);
              return (
                <Panel
                  key={algo.id}
                  title={`${algo.label} (${algo.bits} bits)`}
                  actions={value ? <CopyButton text={value} /> : undefined}
                >
                  {algo.warning && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-500/90 mb-2">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {algo.warning}
                    </p>
                  )}
                  <code className="text-sm font-mono break-all text-green-400">
                    {value ||
                      (fileInfo && algo.id === "MD5" ? (
                        <span className="text-muted-foreground">
                          MD5 disponível apenas para texto
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {fileInfo ? "Processando..." : "Digite algo ou envie um arquivo..."}
                        </span>
                      ))}
                  </code>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      {tab === "hmac" && (
        <>
          <Panel title="Mensagem (payload)">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Corpo da requisição ou texto a assinar..."
              className="min-h-[100px] font-mono text-sm"
            />
          </Panel>
          <Panel title="Secret (chave)">
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Webhook secret / chave HMAC..."
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground mt-2">
              Gere um secret em{" "}
              <a href="/tools/secrets" className="text-primary hover:underline">
                Gerador de Secrets
              </a>{" "}
              (openssl rand -base64 32).
            </p>
          </Panel>
          <Panel title="Algoritmo">
            <div className="flex flex-wrap gap-2 mb-4">
              {HMAC_ALGORITHMS.map((a) => (
                <Button
                  key={a.id}
                  size="sm"
                  variant={hmacAlgo === a.id ? "default" : "outline"}
                  onClick={() => setHmacAlgo(a.id)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
            {hmacResult ? (
              <code className="text-sm font-mono break-all text-green-400 block">
                {hmacResult}
              </code>
            ) : (
              <span className="text-muted-foreground text-sm">
                Informe mensagem e secret...
              </span>
            )}
            {hmacResult && (
              <div className="mt-3">
                <CopyButton text={hmacResult} />
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === "compare" && (
        <Panel title="Comparar dois hashes (timing-safe)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Hash A</label>
              <Textarea
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="mt-1 font-mono text-sm min-h-[80px]"
                placeholder="Primeiro hash..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hash B</label>
              <Textarea
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="mt-1 font-mono text-sm min-h-[80px]"
                placeholder="Segundo hash..."
              />
            </div>
          </div>
          {compareMatch !== null && (
            <div
              className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${
                compareMatch
                  ? "bg-green-500/10 text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {compareMatch ? (
                <>
                  <Check className="h-4 w-4" /> Hashes iguais
                </>
              ) : (
                <>
                  <X className="h-4 w-4" /> Hashes diferentes
                </>
              )}
            </div>
          )}
        </Panel>
      )}
    </ToolLayout>
  );
}
