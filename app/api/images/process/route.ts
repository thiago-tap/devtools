import { type NextRequest, NextResponse } from "next/server";
import {
  epsResponse,
  imageResponse,
  parseImageUpload,
  parseNumberField,
  parseOptionalNumber,
  pdfResponse,
  svgResponse,
  withImageApiGuards,
} from "@/lib/api/image-upload";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/api/security";
import { parseOutputFormat } from "@/lib/images/constants";
import type { HalftoneMode } from "@/lib/images/halftone";
import { parsePipelineJson, runImagePipeline } from "@/lib/images/pipeline";
import {
  isRembgConfigured,
  isRembgHeavyAction,
  pipelineJsonUsesRembg,
  removeBackgroundViaRembg,
} from "@/lib/images/rembg";
import {
  alphaMaskGrayscale,
  convertImage,
  getImageMetadata,
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
import { buildProofPdf } from "@/lib/images/proof-pdf";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ rembg: isRembgConfigured() });
}

export async function POST(request: NextRequest) {
  const blocked = withImageApiGuards(request);
  if (blocked) return blocked;

  const upload = await parseImageUpload(request);
  if (!upload.ok) return upload.response;

  const { buffer, fields, fileName, mime } = upload;
  const action = fields.action?.trim() || "metadata";
  const baseName = fileName.replace(/\.[^.]+$/, "") || "arte";

  const needsRembg =
    isRembgHeavyAction(action) ||
    (action === "pipeline" && pipelineJsonUsesRembg(fields.pipeline));

  if (needsRembg) {
    const ip = getClientIp(request);
    const rembgPerMin = Number(process.env.REMBG_RATE_LIMIT_PER_MIN ?? "12");
    const cap = Number.isFinite(rembgPerMin) && rembgPerMin > 0 ? rembgPerMin : 12;
    const rl = checkRateLimit(`images:rembg:${ip}`, cap, 60_000);
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
    if (!isRembgConfigured()) {
      return NextResponse.json(
        {
          error:
            "Remoção de fundo não está configurada. Defina REMBG_BASE_URL no servidor (serviço Rembg no Easypanel).",
        },
        { status: 503 }
      );
    }
  }

  try {
    switch (action) {
      case "metadata": {
        const meta = await getImageMetadata(buffer);
        return NextResponse.json(meta);
      }

      case "resize": {
        const out = await resizeImage(buffer, {
          widthPx: parseNumberField(fields, "widthPx"),
          heightPx: parseNumberField(fields, "heightPx"),
          widthCm: parseNumberField(fields, "widthCm"),
          heightCm: parseNumberField(fields, "heightCm"),
          dpi: parseNumberField(fields, "dpi"),
        });
        return imageResponse(out, "png", `${baseName}-resize`);
      }

      case "convert": {
        const format = parseOutputFormat(fields.format);
        const out = await convertImage(buffer, {
          format,
          quality: parseNumberField(fields, "quality"),
          dpi: parseNumberField(fields, "dpi"),
        });
        return imageResponse(out, format, `${baseName}-${format}`);
      }

      case "knockout": {
        const color = fields.color?.trim() || "#000000";
        const tolerance = parseNumberField(fields, "tolerance");
        const out = await knockoutColor(buffer, { color, tolerance });
        return imageResponse(out, "png", `${baseName}-knockout`);
      }

      case "knockout_edge": {
        const color = fields.color?.trim() || "#000000";
        const tolerance = parseNumberField(fields, "tolerance");
        const out = await knockoutColorEdgeFlood(buffer, { color, tolerance });
        return imageResponse(out, "png", `${baseName}-fundo-borda`);
      }

      case "knockout_dark": {
        const tolerance = parseNumberField(fields, "tolerance");
        const out = await knockoutDarkColors(buffer, tolerance);
        return imageResponse(out, "png", `${baseName}-sem-pretos`);
      }

      case "preset_dtf": {
        const out = await presetDtf(buffer, {
          widthCm: parseNumberField(fields, "widthCm"),
          heightCm: parseNumberField(fields, "heightCm"),
          dpi: parseNumberField(fields, "dpi"),
        });
        return imageResponse(out, "png", `${baseName}-dtf`);
      }

      case "preset_camisa_preta": {
        const out = await presetBlackShirt(buffer, {
          widthCm: parseNumberField(fields, "widthCm"),
          dpi: parseNumberField(fields, "dpi"),
          tolerance: parseNumberField(fields, "tolerance"),
        });
        return imageResponse(out, "png", `${baseName}-camisa-preta`);
      }

      case "remove_bg": {
        const out = await removeBackgroundViaRembg(buffer, fileName, mime);
        return imageResponse(out, "png", `${baseName}-sem-fundo`);
      }

      case "preset_dtf_transparent": {
        let out = await removeBackgroundViaRembg(buffer, fileName, mime);
        out = await presetDtf(out, {
          widthCm: parseNumberField(fields, "widthCm"),
          heightCm: parseNumberField(fields, "heightCm"),
          dpi: parseNumberField(fields, "dpi"),
        });
        return imageResponse(out, "png", `${baseName}-dtf-transparente`);
      }

      case "preset_camisa_preta_transparent": {
        let out = await removeBackgroundViaRembg(buffer, fileName, mime);
        out = await presetBlackShirt(out, {
          widthCm: parseNumberField(fields, "widthCm"),
          dpi: parseNumberField(fields, "dpi"),
          tolerance: parseNumberField(fields, "tolerance"),
        });
        return imageResponse(out, "png", `${baseName}-camisa-preta-transparente`);
      }

      case "halftone": {
        const modeRaw = fields.mode?.trim().toLowerCase();
        const mode: HalftoneMode = modeRaw === "ordered4" ? "ordered4" : "floyd";
        const out = await halftoneRaster(buffer, {
          mode,
          dpi: parseNumberField(fields, "dpi"),
        });
        return imageResponse(out, "png", `${baseName}-halftone`);
      }

      case "vectorize": {
        const wantEps = (fields.vectorFormat ?? fields.vector_format ?? "svg").toLowerCase().trim() === "eps";
        if (wantEps) {
          const out = await vectorizeToEps(buffer, {
            threshold: parseOptionalNumber(fields, "threshold") ?? 128,
            turdsize: parseOptionalNumber(fields, "turdsize") ?? 2,
          });
          return epsResponse(out, `${baseName}-vetor`);
        }
        const out = await vectorizeToSvg(buffer, {
          threshold: parseOptionalNumber(fields, "threshold") ?? 128,
          turdsize: parseOptionalNumber(fields, "turdsize") ?? 2,
        });
        return svgResponse(out, `${baseName}-vetor`);
      }

      case "alpha_mask": {
        const out = await alphaMaskGrayscale(buffer);
        return imageResponse(out, "png", `${baseName}-mascara-alfa`);
      }

      case "negative_plate": {
        const out = await invertRgbKeepAlpha(buffer);
        return imageResponse(out, "png", `${baseName}-negativo`);
      }

      case "proof_pdf": {
        const out = await buildProofPdf(buffer, { fileLabel: fileName });
        return pdfResponse(out, `${baseName}-prova`);
      }

      case "preset_silk": {
        const modeRaw = fields.mode?.trim().toLowerCase();
        const halftoneMode: HalftoneMode = modeRaw === "ordered4" ? "ordered4" : "floyd";
        const out = await presetSilk(buffer, {
          widthCm: parseNumberField(fields, "widthCm"),
          heightCm: parseNumberField(fields, "heightCm"),
          dpi: parseNumberField(fields, "dpi"),
          halftoneMode,
        });
        return imageResponse(out, "png", `${baseName}-silk`);
      }

      case "pipeline": {
        const steps = parsePipelineJson(fields.pipeline ?? "");
        const { buffer: out, resultKind, rasterFormat } = await runImagePipeline(
          buffer,
          { fileName, mime },
          steps
        );
        switch (resultKind) {
          case "svg":
            return svgResponse(out, `${baseName}-pipeline`);
          case "eps":
            return epsResponse(out, `${baseName}-pipeline`);
          case "pdf":
            return pdfResponse(out, `${baseName}-pipeline`);
          case "raster":
            return imageResponse(out, rasterFormat, `${baseName}-pipeline`);
          default: {
            const _x: never = resultKind;
            return NextResponse.json({ error: `Tipo de saída inválido: ${_x}` }, { status: 500 });
          }
        }
      }

      default:
        return NextResponse.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao processar imagem" },
      { status: 500 }
    );
  }
}
