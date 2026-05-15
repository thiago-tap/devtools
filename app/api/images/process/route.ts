import { type NextRequest, NextResponse } from "next/server";
import {
  imageResponse,
  parseImageUpload,
  parseNumberField,
  withImageApiGuards,
} from "@/lib/api/image-upload";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/api/security";
import type { OutputFormat } from "@/lib/images/constants";
import {
  isRembgConfigured,
  isRembgHeavyAction,
  removeBackgroundViaRembg,
} from "@/lib/images/rembg";
import {
  convertImage,
  getImageMetadata,
  knockoutColor,
  knockoutColorEdgeFlood,
  knockoutDarkColors,
  presetBlackShirt,
  presetDtf,
  resizeImage,
} from "@/lib/images/process";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ rembg: isRembgConfigured() });
}

function parseFormat(fields: Record<string, string>): OutputFormat {
  const f = fields.format?.toLowerCase();
  if (f === "jpeg" || f === "jpg") return "jpeg";
  if (f === "webp") return "webp";
  return "png";
}

export async function POST(request: NextRequest) {
  const blocked = withImageApiGuards(request);
  if (blocked) return blocked;

  const upload = await parseImageUpload(request);
  if (!upload.ok) return upload.response;

  const { buffer, fields, fileName, mime } = upload;
  const action = fields.action?.trim() || "metadata";
  const baseName = fileName.replace(/\.[^.]+$/, "") || "arte";

  if (isRembgHeavyAction(action)) {
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
        const format = parseFormat(fields);
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
