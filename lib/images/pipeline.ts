import { removeBackgroundViaRembg } from "@/lib/images/rembg";
import {
  convertImage,
  knockoutColor,
  knockoutColorEdgeFlood,
  knockoutDarkColors,
  presetBlackShirt,
  presetDtf,
  presetSilk,
  resizeImage,
  vectorizeToSvg,
  halftoneRaster,
} from "@/lib/images/process";
import type { OutputFormat } from "@/lib/images/constants";
import type { HalftoneMode } from "@/lib/images/halftone";

export type PipelineStep = Record<string, string> & { action: string };

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
]);

const MAX_STEPS = 14;

function num(fields: Record<string, string>, key: string, fallback?: number): number | undefined {
  const raw = fields[key]?.trim();
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseFormat(s: string | undefined): OutputFormat {
  const f = s?.toLowerCase();
  if (f === "jpeg" || f === "jpg") return "jpeg";
  if (f === "webp") return "webp";
  return "png";
}

function parseHalftoneMode(s: string | undefined): HalftoneMode {
  return s === "ordered4" ? "ordered4" : "floyd";
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
): Promise<{ buffer: Buffer; isSvg: boolean }> {
  let buf = initial;
  let isSvg = false;

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
        isSvg = false;
        break;
      }
      case "convert": {
        buf = await convertImage(buf, {
          format: parseFormat(f.format),
          quality: num(f, "quality", 90),
          dpi: num(f, "dpi"),
        });
        isSvg = false;
        break;
      }
      case "knockout": {
        buf = await knockoutColor(buf, {
          color: f.color?.trim() || "#000000",
          tolerance: num(f, "tolerance"),
        });
        isSvg = false;
        break;
      }
      case "knockout_edge": {
        buf = await knockoutColorEdgeFlood(buf, {
          color: f.color?.trim() || "#000000",
          tolerance: num(f, "tolerance"),
        });
        isSvg = false;
        break;
      }
      case "knockout_dark": {
        buf = await knockoutDarkColors(buf, num(f, "tolerance"));
        isSvg = false;
        break;
      }
      case "remove_bg": {
        buf = await removeBackgroundViaRembg(buf, ctx.fileName, ctx.mime);
        isSvg = false;
        break;
      }
      case "preset_dtf": {
        buf = await presetDtf(buf, {
          widthCm: num(f, "widthCm"),
          heightCm: num(f, "heightCm"),
          dpi: num(f, "dpi"),
        });
        isSvg = false;
        break;
      }
      case "preset_camisa_preta": {
        buf = await presetBlackShirt(buf, {
          widthCm: num(f, "widthCm"),
          dpi: num(f, "dpi"),
          tolerance: num(f, "tolerance"),
        });
        isSvg = false;
        break;
      }
      case "preset_dtf_transparent": {
        buf = await removeBackgroundViaRembg(buf, ctx.fileName, ctx.mime);
        buf = await presetDtf(buf, {
          widthCm: num(f, "widthCm"),
          heightCm: num(f, "heightCm"),
          dpi: num(f, "dpi"),
        });
        isSvg = false;
        break;
      }
      case "preset_camisa_preta_transparent": {
        buf = await removeBackgroundViaRembg(buf, ctx.fileName, ctx.mime);
        buf = await presetBlackShirt(buf, {
          widthCm: num(f, "widthCm"),
          dpi: num(f, "dpi"),
          tolerance: num(f, "tolerance"),
        });
        isSvg = false;
        break;
      }
      case "halftone": {
        buf = await halftoneRaster(buf, {
          mode: parseHalftoneMode(f.mode),
          dpi: num(f, "dpi"),
        });
        isSvg = false;
        break;
      }
      case "vectorize": {
        buf = await vectorizeToSvg(buf, {
          threshold: num(f, "threshold", 128),
          turdsize: num(f, "turdsize", 2),
        });
        isSvg = true;
        break;
      }
      case "preset_silk": {
        buf = await presetSilk(buf, {
          widthCm: num(f, "widthCm"),
          heightCm: num(f, "heightCm"),
          dpi: num(f, "dpi"),
          halftoneMode: parseHalftoneMode(f.mode),
        });
        isSvg = false;
        break;
      }
      default:
        throw new Error(`Passo desconhecido: ${step.action}`);
    }
  }

  return { buffer: buf, isSvg };
}
