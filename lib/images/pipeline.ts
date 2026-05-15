import type { OutputFormat } from "@/lib/images/constants";
import { parseOutputFormat } from "@/lib/images/constants";
import { buildProofPdf } from "@/lib/images/proof-pdf";
import {
  alphaMaskGrayscale,
  convertImage,
  halftoneRaster,
  invertRgbKeepAlpha,
  knockoutColor,
  knockoutColorEdgeFlood,
  knockoutDarkColors,
  presetBlackShirt,
  presetDtf,
  presetSilk,
  resizeImage,
  vectorizeToEps,
  vectorizeToSvg,
} from "@/lib/images/process";
import type { HalftoneMode } from "@/lib/images/halftone";
import { removeBackgroundViaRembg } from "@/lib/images/rembg";

export type PipelineStep = Record<string, string> & { action: string };

export type PipelineResultKind = "raster" | "svg" | "eps" | "pdf";

const ALLOWED_ACTIONS = new Set([
  "resize",
  "convert",
  "knockout",
  "knockout_edge",
  "knockout_dark",
  "remove_bg",
  "preset_dtf",
  "preset_camisa_preta",
  "preset_dtf_transparent",
  "preset_camisa_preta_transparent",
  "halftone",
  "vectorize",
  "preset_silk",
  "alpha_mask",
  "negative_plate",
  "proof_pdf",
]);

const MAX_STEPS = 16;

function num(fields: Record<string, string>, key: string, fallback?: number): number | undefined {
  const raw = fields[key]?.trim();
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseHalftoneMode(s: string | undefined): HalftoneMode {
  return s === "ordered4" ? "ordered4" : "floyd";
}

function parseVectorFormat(f: Record<string, string>): "svg" | "eps" {
  const raw = (f.vectorFormat ?? f.vector_format ?? "svg").toLowerCase().trim();
  return raw === "eps" ? "eps" : "svg";
}

export function parsePipelineJson(raw: string): PipelineStep[] {
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Campo pipeline: JSON inválido.");
  }
  if (!Array.isArray(data) || data.length === 0 || data.length > MAX_STEPS) {
    throw new Error(`pipeline: envie um array com 1 a ${MAX_STEPS} passos.`);
  }
  const out: PipelineStep[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Cada passo do pipeline deve ser um objeto.");
    }
    const o = item as Record<string, unknown>;
    const action = typeof o.action === "string" ? o.action.trim() : "";
    if (!action || !ALLOWED_ACTIONS.has(action)) {
      throw new Error(`Ação de pipeline não permitida: ${action || "(vazia)"}`);
    }
    const flat: PipelineStep = { action };
    for (const [k, v] of Object.entries(o)) {
      if (k === "action") continue;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        flat[k] = String(v);
      }
    }
    out.push(flat);
  }
  return out;
}

export function pipelineNeedsRembg(steps: PipelineStep[]): boolean {
  return steps.some((s) =>
    ["remove_bg", "preset_dtf_transparent", "preset_camisa_preta_transparent"].includes(s.action)
  );
}

export async function runImagePipeline(
  initial: Buffer,
  ctx: { fileName: string; mime: string },
  steps: PipelineStep[]
): Promise<{ buffer: Buffer; resultKind: PipelineResultKind; rasterFormat: OutputFormat }> {
  let buf = initial;
  let resultKind: PipelineResultKind = "raster";
  let rasterFormat: OutputFormat = "png";

  for (const step of steps) {
    const f = step as Record<string, string>;
    switch (step.action) {
      case "resize": {
        buf = await resizeImage(buf, {
          widthPx: num(f, "widthPx"),
          heightPx: num(f, "heightPx"),
          widthCm: num(f, "widthCm"),
          heightCm: num(f, "heightCm"),
          dpi: num(f, "dpi"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "convert": {
        const fmt = parseOutputFormat(f.format);
        buf = await convertImage(buf, {
          format: fmt,
          quality: num(f, "quality", 90),
          dpi: num(f, "dpi"),
        });
        resultKind = "raster";
        rasterFormat = fmt;
        break;
      }
      case "knockout": {
        buf = await knockoutColor(buf, {
          color: f.color?.trim() || "#000000",
          tolerance: num(f, "tolerance"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "knockout_edge": {
        buf = await knockoutColorEdgeFlood(buf, {
          color: f.color?.trim() || "#000000",
          tolerance: num(f, "tolerance"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "knockout_dark": {
        buf = await knockoutDarkColors(buf, num(f, "tolerance"));
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "remove_bg": {
        buf = await removeBackgroundViaRembg(buf, ctx.fileName, ctx.mime);
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "preset_dtf": {
        buf = await presetDtf(buf, {
          widthCm: num(f, "widthCm"),
          heightCm: num(f, "heightCm"),
          dpi: num(f, "dpi"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "preset_camisa_preta": {
        buf = await presetBlackShirt(buf, {
          widthCm: num(f, "widthCm"),
          dpi: num(f, "dpi"),
          tolerance: num(f, "tolerance"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "preset_dtf_transparent": {
        buf = await removeBackgroundViaRembg(buf, ctx.fileName, ctx.mime);
        buf = await presetDtf(buf, {
          widthCm: num(f, "widthCm"),
          heightCm: num(f, "heightCm"),
          dpi: num(f, "dpi"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "preset_camisa_preta_transparent": {
        buf = await removeBackgroundViaRembg(buf, ctx.fileName, ctx.mime);
        buf = await presetBlackShirt(buf, {
          widthCm: num(f, "widthCm"),
          dpi: num(f, "dpi"),
          tolerance: num(f, "tolerance"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "halftone": {
        buf = await halftoneRaster(buf, {
          mode: parseHalftoneMode(f.mode),
          dpi: num(f, "dpi"),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "vectorize": {
        if (parseVectorFormat(f) === "eps") {
          buf = await vectorizeToEps(buf, {
            threshold: num(f, "threshold", 128),
            turdsize: num(f, "turdsize", 2),
          });
          resultKind = "eps";
        } else {
          buf = await vectorizeToSvg(buf, {
            threshold: num(f, "threshold", 128),
            turdsize: num(f, "turdsize", 2),
          });
          resultKind = "svg";
        }
        break;
      }
      case "preset_silk": {
        buf = await presetSilk(buf, {
          widthCm: num(f, "widthCm"),
          heightCm: num(f, "heightCm"),
          dpi: num(f, "dpi"),
          halftoneMode: parseHalftoneMode(f.mode),
        });
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "alpha_mask": {
        buf = await alphaMaskGrayscale(buf);
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "negative_plate": {
        buf = await invertRgbKeepAlpha(buf);
        resultKind = "raster";
        rasterFormat = "png";
        break;
      }
      case "proof_pdf": {
        buf = await buildProofPdf(buf, { fileLabel: ctx.fileName });
        resultKind = "pdf";
        break;
      }
      default:
        throw new Error(`Passo desconhecido: ${step.action}`);
    }
  }

  return { buffer: buf, resultKind, rasterFormat };
}