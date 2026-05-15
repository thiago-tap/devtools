"use client";

import { useCallback, useRef, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, ImageIcon, Loader2, Shirt, Upload } from "lucide-react";
import { formatBytes } from "@/lib/utils";

type ImageMeta = {
  width: number;
  height: number;
  format: string;
  density: number;
  widthCm: number | null;
  heightCm: number | null;
};

type Tab = "ajustar" | "cores" | "exportar" | "presets";

async function callImageApi(
  file: File,
  fields: Record<string, string>
): Promise<{ blob?: Blob; meta?: ImageMeta; error?: string }> {
  const form = new FormData();
  form.append("file", file);
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }

  const res = await fetch("/api/images/process", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    return { error: (err as { error?: string }).error ?? "Erro ao processar" };
  }

  const type = res.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    return { meta: (await res.json()) as ImageMeta };
  }

  return { blob: await res.blob() };
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EstampasPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [tab, setTab] = useState<Tab>("presets");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<Blob | null>(null);

  const [widthCm, setWidthCm] = useState("28");
  const [dpi, setDpi] = useState("300");
  const [knockColor, setKnockColor] = useState("#000000");
  const [tolerance, setTolerance] = useState("40");
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState("90");

  const inputRef = useRef<HTMLInputElement>(null);

  const loadMeta = useCallback(async (f: File) => {
    const { meta: m, error: err } = await callImageApi(f, { action: "metadata" });
    if (err) setError(err);
    else if (m) setMeta(m);
  }, []);

  const onFile = async (f: File | null) => {
    setError("");
    setLastResult(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      setMeta(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    await loadMeta(f);
  };

  const run = async (fields: Record<string, string>, downloadName: string) => {
    if (!file) {
      setError("Envie uma imagem primeiro.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { blob, error: err } = await callImageApi(file, fields);
      if (err || !blob) {
        setError(err ?? "Sem resultado");
        return;
      }
      setLastResult(blob);
      setPreview(URL.createObjectURL(blob));
      downloadBlob(blob, downloadName);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "presets", label: "Presets" },
    { id: "ajustar", label: "Redimensionar" },
    { id: "cores", label: "Cores" },
    { id: "exportar", label: "Exportar" },
  ];

  return (
    <ToolLayout
      title="Estúdio de Estampas"
      description="Prepare arte para camisetas: resize com DPI, remover pretos (camisa preta), export PNG/JPEG/WebP"
    >
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
        <strong>Privacidade:</strong> imagens são enviadas ao servidor para processamento e não são
        armazenadas permanentemente. Máx. 25 MB por arquivo.
      </div>

      <Panel title="Imagem">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f?.type.startsWith("image/")) void onFile(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
          {preview ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-md object-contain bg-muted"
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} · {formatBytes(file.size)}
                  {meta &&
                    ` · ${meta.width}×${meta.height}px @ ${meta.density} DPI` +
                      (meta.widthCm ? ` · ~${meta.widthCm}×${meta.heightCm} cm` : "")}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-10 w-10" />
              <p>Arraste ou clique para enviar PNG, JPEG ou WebP</p>
            </div>
          )}
        </div>
      </Panel>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
            disabled={!file}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "presets" && (
        <Panel title="Presets para estampa">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <ImageIcon className="h-4 w-4" />
                DTF / Sublimação
              </div>
              <p className="text-xs text-muted-foreground">
                PNG 300 DPI, largura em cm (proporção mantida).
              </p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Largura (cm)</label>
                  <Input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
                </div>
                <Button
                  disabled={loading || !file}
                  onClick={() =>
                    run(
                      {
                        action: "preset_dtf",
                        widthCm,
                        dpi,
                      },
                      `dtf-${file?.name ?? "arte"}.png`
                    )
                  }
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Shirt className="h-4 w-4" />
                Camisa preta
              </div>
              <p className="text-xs text-muted-foreground">
                Remove pretos/cinzas escuros + PNG 300 DPI (knockout para malha preta).
              </p>
              <div className="flex gap-2 items-end flex-wrap">
                <div className="w-24">
                  <label className="text-xs text-muted-foreground">Largura (cm)</label>
                  <Input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted-foreground">Tolerância</label>
                  <Input value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
                </div>
                <Button
                  disabled={loading || !file}
                  onClick={() =>
                    run(
                      {
                        action: "preset_camisa_preta",
                        widthCm,
                        dpi,
                        tolerance,
                      },
                      `camisa-preta-${file?.name ?? "arte"}.png`
                    )
                  }
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {tab === "ajustar" && (
        <Panel title="Redimensionar (DPI)">
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">Largura (cm)</label>
              <Input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">DPI</label>
              <Input value={dpi} onChange={(e) => setDpi(e.target.value)} />
            </div>
            <Button
              disabled={loading || !file}
              onClick={() =>
                run(
                  { action: "resize", widthCm, dpi },
                  `resize-${file?.name ?? "arte"}.png`
                )
              }
            >
              Redimensionar
            </Button>
          </div>
        </Panel>
      )}

      {tab === "cores" && (
        <Panel title="Remover cor (knockout)">
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">Cor HEX</label>
              <Input value={knockColor} onChange={(e) => setKnockColor(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tolerância</label>
              <Input value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
            </div>
            <Button
              variant="outline"
              disabled={loading || !file}
              onClick={() =>
                run(
                  { action: "knockout", color: knockColor, tolerance },
                  `knockout-${file?.name ?? "arte"}.png`
                )
              }
            >
              Cor específica
            </Button>
            <Button
              disabled={loading || !file}
              onClick={() =>
                run(
                  { action: "knockout_dark", tolerance },
                  `sem-pretos-${file?.name ?? "arte"}.png`
                )
              }
            >
              Remover pretos
            </Button>
          </div>
        </Panel>
      )}

      {tab === "exportar" && (
        <Panel title="Converter formato">
          <div className="flex gap-2 flex-wrap items-end">
            {(["png", "jpeg", "webp"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={exportFormat === f ? "default" : "outline"}
                onClick={() => setExportFormat(f)}
              >
                {f.toUpperCase()}
              </Button>
            ))}
            {exportFormat !== "png" && (
              <div className="w-20">
                <label className="text-xs text-muted-foreground">Qualidade</label>
                <Input value={quality} onChange={(e) => setQuality(e.target.value)} />
              </div>
            )}
            <Button
              disabled={loading || !file}
              onClick={() =>
                run(
                  {
                    action: "convert",
                    format: exportFormat,
                    quality,
                    dpi,
                  },
                  `export.${exportFormat === "jpeg" ? "jpg" : exportFormat}`
                )
              }
            >
              Exportar
            </Button>
          </div>
        </Panel>
      )}

      {lastResult && (
        <Panel
          title="Último resultado"
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadBlob(lastResult, "arte-processada.png")}
            >
              <Download className="h-4 w-4 mr-1" />
              Baixar de novo
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            O download iniciou automaticamente. Use o botão acima para baixar novamente.
          </p>
        </Panel>
      )}

      <p className="text-xs text-muted-foreground">
        Próximas fases: remover fundo (IA), halftone, vetorização — ver{" "}
        <code className="text-xs">docs/roadmap.md</code>
      </p>
    </ToolLayout>
  );
}
