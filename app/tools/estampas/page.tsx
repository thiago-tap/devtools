"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Download, ImageIcon, Layers, Loader2, Pipette, Shirt, Upload, Wand2 } from "lucide-react";
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

type Tab = "ajustar" | "cores" | "exportar" | "presets" | "fundo" | "halftone" | "vetor" | "pipeline";

const RECIPE_LS_KEY = "devtools_estampas_recipes_v1";

const DEFAULT_PIPELINE_JSON = `[
  {"action":"resize","widthCm":"28","dpi":"300"},
  {"action":"halftone","mode":"floyd"}
]`;

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

  const [halftoneMode, setHalftoneMode] = useState<"floyd" | "ordered4">("floyd");
  const [vectorThreshold, setVectorThreshold] = useState("128");
  const [vectorTurd, setVectorTurd] = useState("2");
  const [pipelineJson, setPipelineJson] = useState(DEFAULT_PIPELINE_JSON);
  const [recipeName, setRecipeName] = useState("");
  const [savedRecipes, setSavedRecipes] = useState<{ name: string; json: string }[]>([]);
  const [recipeSelect, setRecipeSelect] = useState("");
  const batchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECIPE_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setSavedRecipes(
            parsed.filter(
              (x): x is { name: string; json: string } =>
                x &&
                typeof x === "object" &&
                typeof (x as { name?: string }).name === "string" &&
                typeof (x as { json?: string }).json === "string"
            )
          );
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

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

  const persistRecipes = useCallback((list: { name: string; json: string }[]) => {
    setSavedRecipes(list);
    try {
      localStorage.setItem(RECIPE_LS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }, []);

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

  const runPipeline = async () => {
    if (!file) {
      setError("Envie uma imagem primeiro.");
      return;
    }
    let pipelineStr = pipelineJson.trim();
    try {
      JSON.parse(pipelineStr);
    } catch {
      setError("JSON do pipeline inválido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { blob, error: err } = await callImageApi(file, {
        action: "pipeline",
        pipeline: pipelineStr,
      });
      if (err || !blob) {
        setError(err ?? "Sem resultado");
        return;
      }
      const ext = blob.type.includes("svg") ? "svg" : "png";
      setLastResult(blob);
      setPreview(URL.createObjectURL(blob));
      downloadBlob(blob, `pipeline-${(file.name.replace(/\.[^.]+$/, "") || "arte")}.${ext}`);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentRecipe = () => {
    try {
      JSON.parse(pipelineJson.trim());
    } catch {
      setError("Guarde só JSON válido no pipeline.");
      return;
    }
    const name = recipeName.trim() || `Receita ${savedRecipes.length + 1}`;
    const next = [...savedRecipes, { name, json: pipelineJson.trim() }].slice(-25);
    persistRecipes(next);
    setRecipeName("");
    setError("");
  };

  const runPipelineBatch = async () => {
    const list = batchInputRef.current?.files;
    if (!list?.length) {
      setError("Selecione um ou mais ficheiros no lote.");
      return;
    }
    const pipelineStr = pipelineJson.trim();
    try {
      JSON.parse(pipelineStr);
    } catch {
      setError("JSON do pipeline inválido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      for (let i = 0; i < list.length; i++) {
        const f = list.item(i)!;
        const { blob, error: err } = await callImageApi(f, {
          action: "pipeline",
          pipeline: pipelineStr,
        });
        if (err || !blob) {
          setError(`${f.name}: ${err ?? "falhou"}`);
          return;
        }
        const ext = blob.type.includes("svg") ? "svg" : "png";
        const base = f.name.replace(/\.[^.]+$/, "") || `arte-${i}`;
        downloadBlob(blob, `pipeline-${base}.${ext}`);
      }
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
    { id: "halftone", label: "Halftone" },
    { id: "vetor", label: "Vetor (SVG)" },
    { id: "pipeline", label: "Pipeline / lote" },
    { id: "exportar", label: "Exportar" },
  ];

  return (
    <ToolLayout
      title="Estúdio de Estampas"
      description="Arte para camisetas: Rembg, DPI, knockout, halftone (silk), vetor SVG (potrace), pipeline em lote e presets DTF/camisa preta"
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

            <div className="rounded-lg border p-4 space-y-3 sm:col-span-2">
              <div className="flex items-center gap-2 font-medium">
                <Layers className="h-4 w-4" />
                Silk 1 cor (halftone + cm)
              </div>
              <p className="text-xs text-muted-foreground">
                Floyd–Steinberg ou Bayer 4×4 + redimensionamento opcional (300 DPI típico).
              </p>
              <div className="flex flex-wrap gap-2 items-end">
                <div className="w-28">
                  <label className="text-xs text-muted-foreground">Modo</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={halftoneMode}
                    onChange={(e) => setHalftoneMode(e.target.value === "ordered4" ? "ordered4" : "floyd")}
                  >
                    <option value="floyd">Floyd–Steinberg</option>
                    <option value="ordered4">Bayer 4×4</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted-foreground">Largura (cm)</label>
                  <Input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted-foreground">DPI</label>
                  <Input value={dpi} onChange={(e) => setDpi(e.target.value)} />
                </div>
                <Button
                  disabled={loading || !file}
                  onClick={() =>
                    run(
                      {
                        action: "preset_silk",
                        widthCm,
                        dpi,
                        mode: halftoneMode,
                      },
                      `silk-${file?.name ?? "arte"}.png`
                    )
                  }
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar Silk"}
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
            Para cartão com fundo que encosta à borda da imagem, use primeiro{" "}
            <strong>Fundo pela borda</strong>: a inundação sai das quatro molduras e não atravessa
            anti-alias do texto preto (mais estável que apagar a cor em todo o mapa). Se o fundo
            não tocar à borda ou houver o mesmo roxo dentro de um buraco de letra fechado (O, P, R…), use{" "}
            <strong>Cor em toda a imagem</strong>. Ajuste a tolerância se notar halo ou falhas.
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
          <div className="grid sm:grid-cols-2 gap-3 items-end mb-4">
            <div>
              <label className="text-xs text-muted-foreground">Cor HEX</label>
              <Input value={knockColor} onChange={(e) => setKnockColor(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tolerância</label>
              <Input value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              disabled={loading || !file}
              onClick={() =>
                run(
                  { action: "knockout_edge", color: knockColor, tolerance },
                  `fundo-borda-${file?.name ?? "arte"}.png`
                )
              }
            >
              Fundo pela borda (recomendado)
            </Button>
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
              Cor em toda a imagem
            </Button>
            <Button
              variant="outline"
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

      {tab === "halftone" && (
        <Panel title="Halftone (meio-tom)">
          <p className="text-sm text-muted-foreground mb-4">
            Converte luminância para pontos pretos/brancos (útil para silk 1 cor). Transparência é
            tratada como papel branco por baixo.
          </p>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="w-40">
              <label className="text-xs text-muted-foreground">Modo</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={halftoneMode}
                onChange={(e) => setHalftoneMode(e.target.value === "ordered4" ? "ordered4" : "floyd")}
              >
                <option value="floyd">Floyd–Steinberg</option>
                <option value="ordered4">Bayer 4×4</option>
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground">DPI (meta)</label>
              <Input value={dpi} onChange={(e) => setDpi(e.target.value)} />
            </div>
            <Button
              disabled={loading || !file}
              onClick={() =>
                run(
                  { action: "halftone", mode: halftoneMode, dpi },
                  `halftone-${file?.name ?? "arte"}.png`
                )
              }
            >
              Aplicar halftone
            </Button>
          </div>
        </Panel>
      )}

      {tab === "vetor" && (
        <Panel title="Vetorizar (SVG)">
          <p className="text-sm text-muted-foreground mb-4">
            Monocromático via <strong>potrace</strong> no servidor (imagem Docker inclui o binário).
            Ajuste o limiar se o traço sumir ou ficar cheio de ruído.
          </p>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="w-28">
              <label className="text-xs text-muted-foreground">Limiar (0–255)</label>
              <Input value={vectorThreshold} onChange={(e) => setVectorThreshold(e.target.value)} />
            </div>
            <div className="w-28">
              <label className="text-xs text-muted-foreground">Turdsize</label>
              <Input value={vectorTurd} onChange={(e) => setVectorTurd(e.target.value)} />
            </div>
            <Button
              disabled={loading || !file}
              onClick={() =>
                run(
                  {
                    action: "vectorize",
                    threshold: vectorThreshold,
                    turdsize: vectorTurd,
                  },
                  `vetor-${(file?.name ?? "arte").replace(/\.[^.]+$/, "")}.svg`
                )
              }
            >
              Baixar SVG
            </Button>
          </div>
        </Panel>
      )}

      {tab === "pipeline" && (
        <Panel title="Pipeline e lote">
          <p className="text-sm text-muted-foreground mb-3">
            Array JSON de passos com <code className="text-xs">action</code> e campos iguais ao
            formulário da API. Passos com Rembg exigem <code className="text-xs">REMBG_BASE_URL</code>.
            Último passo com <code className="text-xs">vectorize</code> devolve SVG.
          </p>
          <Textarea
            className="font-mono text-xs min-h-[180px] mb-4"
            value={pipelineJson}
            onChange={(e) => setPipelineJson(e.target.value)}
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2 items-end mb-6">
            <Button disabled={loading || !file} onClick={() => void runPipeline()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Executar na imagem atual"}
            </Button>
            <div className="flex gap-2 items-end">
              <div className="w-40">
                <label className="text-xs text-muted-foreground">Nome da receita</label>
                <Input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="Ex.: DTF+halftone" />
              </div>
              <Button type="button" variant="outline" onClick={() => saveCurrentRecipe()}>
                Guardar no navegador
              </Button>
            </div>
            <div className="w-full sm:w-56">
              <label className="text-xs text-muted-foreground">Carregar receita</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={recipeSelect}
                onChange={(e) => {
                  const v = e.target.value;
                  setRecipeSelect(v);
                  const i = Number(v);
                  if (Number.isFinite(i) && savedRecipes[i]) {
                    setPipelineJson(savedRecipes[i]!.json);
                  }
                }}
              >
                <option value="">— escolher —</option>
                {savedRecipes.map((r, i) => (
                  <option key={`${r.name}-${i}`} value={String(i)}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Lote (vários ficheiros)</p>
            <p className="text-xs text-muted-foreground">
              Usa o mesmo JSON em cada ficheiro. Os downloads disparam em sequência.
            </p>
            <input
              ref={batchInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="text-sm"
            />
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void runPipelineBatch()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Processar lote"}
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
