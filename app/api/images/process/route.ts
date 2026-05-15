import { type NextRequest, NextResponse } from "next/server";
import {
  imageResponse,
  parseImageUpload,
  parseNumberField,
  withImageApiGuards,
} from "@/lib/api/image-upload";
import type { OutputFormat } from "@/lib/images/constants";
import {
  convertImage,
  getImageMetadata,
  knockoutColor,
  knockoutDarkColors,
  presetBlackShirt,
  presetDtf,
  resizeImage,
} from "@/lib/images/process";

export const runtime = "nodejs";

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

  const { buffer, fields, fileName } = upload;
  const action = fields.action?.trim() || "metadata";
  const baseName = fileName.replace(/\.[^.]+$/, "") || "arte";

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
