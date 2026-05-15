"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, ImageIcon, Loader2, Pipette, Shirt, Upload, Wand2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";

declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

function clampChannel(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (c: number) => clampChannel(c).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

type ImageMeta = {
  width: number;
  height: number;
  format: string;
  density: number;
  widthCm: number | null;
  heightCm: number | null;
};

type Tab = "ajustar" | "cores" | "exportar" | "presets" | "fundo";

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

  const [rembgAvailable, setRembgAvailable] = useState<boolean | null>(null);
  const [pickColorFromPreview, setPickColorFromPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/images/process")
      .then((r) => r.json() as Promise<{ rembg?: boolean }>)
      .then((j) => {
        if (!cancelled) setRembgAvailable(!!j.rembg);
      })
      .catch(() => {
        if (!cancelled) setRembgAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab !== "cores") setPickColorFromPreview(false);
  }, [tab]);

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
      setPickColorFromPreview(false);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPickColorFromPreview(false);
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

  const sampleColorFromPreviewClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return;

    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    let x = Math.floor((e.clientX - rect.left) * scaleX);
    let y = Math.floor((e.clientY - rect.top) * scaleY);
    x = Math.max(0, Math.min(img.naturalWidth - 1, x));
    y = Math.max(0, Math.min(img.naturalHeight - 1, y));

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(x, y, 1, 1).data;
    setKnockColor(rgbToHex(px[0], px[1], px[2]));
    setPickColorFromPreview(false);
    setError("");
  }, []);

  const openEyeDropper = useCallback(async () => {
    if (typeof window.EyeDropper !== "function") {
      setError(
        "Este navegador não tem amostra nativa. Use Chrome/Edge ou o botão «Clicar na imagem»."
      );
      return;
    }
    try {
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      setKnockColor(result.sRGBHex.toUpperCase());
      setError("");
    } catch {
      /* utilizador cancelou */
    }
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "presets", label: "Presets" },
    { id: "fundo", label: "Remover fundo" },
    { id: "ajustar", label: "Redimensionar" },
    { id: "cores", label: "Cores" },
    { id: "exportar", label: "Exportar" },
  ];

  return (
    <ToolLayout
      title="Estúdio de Estampas"
      description="Arte para camisetas: remover fundo (Rembg + Sharp), DPI, knockout, presets DTF e camisa preta"
    >
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
        <strong>Privacidade:</strong> imagens são enviadas ao servidor para processamento e não são
        armazenadas permanentemente. Remoção de fundo pode encaminhar o arquivo a um serviço Rembg na
        mesma infraestrutura. Máx. 25 MB por arquivo.
      </div>

      <Panel title="Imagem">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            if (!pickColorFromPreview) inputRef.current?.click();
          }}
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
                className={
                  "max-h-64 mx-auto rounded-md object-contain bg-muted " +
                  (pickColorFromPreview
                    ? "cursor-crosshair ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "")
                }
                onClick={(e) => {
                  if (pickColorFromPreview) {
                    e.stopPropagation();
                    sampleColorFromPreviewClick(e);
                  }
                }}
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

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Wand2 className="h-4 w-4" />
                DTF sem fundo
              </div>
              <p className="text-xs text-muted-foreground">
                Rembg (IA) + PNG 300 DPI em cm. Requer serviço Rembg configurado.
              </p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Largura (cm)</label>
                  <Input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
                </div>
                <Button
                  disabled={loading || !file || rembgAvailable === false}
                  onClick={() =>
                    run(
                      {
                        action: "preset_dtf_transparent",
                        widthCm,
                        dpi,
                      },
                      `dtf-transparente-${file?.name ?? "arte"}.png`
                    )
                  }
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Wand2 className="h-4 w-4" />
                Camisa preta + sem fundo
              </div>
              <p className="text-xs text-muted-foreground">
                Rembg + remove pretos + resize. Melhor quando a arte ainda tem fundo sólido.
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
                  disabled={loading || !file || rembgAvailable === false}
                  onClick={() =>
                    run(
                      {
                        action: "preset_camisa_preta_transparent",
                        widthCm,
                        dpi,
                        tolerance,
                      },
                      `camisa-preta-transparente-${file?.name ?? "arte"}.png`
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

      {tab === "fundo" && (
        <Panel title="Remover fundo (Rembg)">
          {rembgAvailable === false && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100 mb-4">
              O <strong>Rembg</strong> não está configurado neste servidor. No Easypanel, crie um
              serviço com a imagem <code className="text-xs">danielgatis/rembg</code> (comando{" "}
              <code className="text-xs">s --host 0.0.0.0 --port 7000</code>) na mesma rede e defina{" "}
              <code className="text-xs">REMBG_BASE_URL</code> no app DevToolbox (ex.:{" "}
              <code className="text-xs">http://rembg:7000</code>). Veja{" "}
              <code className="text-xs">docs/easypanel-setup.md</code> — não precisa existir template
              “Rembg” na lista.
            </div>
          )}
          {rembgAvailable === null && (
            <p className="text-sm text-muted-foreground mb-4">Verificando disponibilidade…</p>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            Usa o modelo de segmentação do Rembg (serviço dedicado). Pode levar de alguns segundos a
            mais de um minuto conforme tamanho da imagem e CPU do servidor.
          </p>
          <Button
            disabled={loading || !file || rembgAvailable === false}
            onClick={() =>
              run({ action: "remove_bg" }, `sem-fundo-${file?.name?.replace(/\.[^.]+$/, "") ?? "arte"}.png`)
            }
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover fundo e baixar PNG"}
          </Button>
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
          <p className="text-sm text-muted-foreground mb-3">
            Para fundo sólido (ex.: roxo), prefira amostrar a cor com o pincel ou o clique na imagem — melhor que Rembg para texto. Bordas anti-alias são limpas com cuidado para não apagar tipografia pequena; se notar halo roxo, suba a tolerância; se as letras pequenas sumirem, baixe um pouco.
          </p>
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!file}
              onClick={() => void openEyeDropper()}
              className="gap-1"
            >
              <Pipette className="h-4 w-4" />
              Amostra na tela
            </Button>
            <Button
              type="button"
              variant={pickColorFromPreview ? "default" : "outline"}
              size="sm"
              disabled={!preview}
              onClick={() => {
                setPickColorFromPreview((v) => !v);
                setError("");
              }}
            >
              {pickColorFromPreview ? "Cancelar clique na imagem" : "Clicar na imagem"}
            </Button>
            <span
              className="inline-block h-8 w-8 rounded border border-border shrink-0"
              style={{ backgroundColor: knockColor }}
              title={knockColor}
            />
          </div>
          {pickColorFromPreview && (
            <p className="text-xs text-primary mb-4">
              Clique no preview acima na cor que deseja remover. O campo HEX será preenchido automaticamente.
            </p>
          )}
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
        Ver <code className="text-xs">docs/easypanel-setup.md</code> (Rembg) e{" "}
        <code className="text-xs">docs/roadmap.md</code> para halftone e vetorização.
      </p>
    </ToolLayout>
  );
}
