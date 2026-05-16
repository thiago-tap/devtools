import { type NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  type OutputFormat,
  rasterDownloadParts,
} from "@/lib/images/constants";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/api/security";

export function withImageApiGuards(request: NextRequest): NextResponse | null {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`images:${ip}`, 30, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  return null;
}

export async function parseImageUpload(
  request: NextRequest
): Promise<
  | { ok: true; buffer: Buffer; fileName: string; mime: string; fields: Record<string, string> }
  | { ok: false; response: NextResponse }
> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Arquivo excede o limite de ${MAX_UPLOAD_MB} MB` },
        { status: 413 }
      ),
    };
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Formulário inválido" }, { status: 400 }),
    };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Envie um arquivo de imagem" }, { status: 400 }),
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Arquivo excede o limite de ${MAX_UPLOAD_MB} MB` },
        { status: 413 }
      ),
    };
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Formato não suportado. Use PNG, JPEG, WebP ou GIF." },
        { status: 400 }
      ),
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key !== "file" && typeof value === "string") {
      fields[key] = value;
    }
  }

  return {
    ok: true,
    buffer,
    fileName: file.name,
    mime,
    fields,
  };
}

export function imageResponse(buffer: Buffer, format: OutputFormat, baseName: string): NextResponse {
  const { contentType, ext } = rasterDownloadParts(format);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${baseName}.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function pdfResponse(buffer: Buffer, baseName: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

export function epsResponse(buffer: Buffer, baseName: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/postscript",
      "Content-Disposition": `attachment; filename="${baseName}.eps"`,
      "Cache-Control": "no-store",
    },
  });
}

export function zipResponse(buffer: Buffer, baseName: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${baseName}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}

export function svgResponse(buffer: Buffer, baseName: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.svg"`,
      "Cache-Control": "no-store",
    },
  });
}

export function parseNumberField(
  fields: Record<string, string>,
  key: string
): number | undefined {
  const raw = fields[key]?.trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Qualquer número finito (ex.: threshold 0). */
export function parseOptionalNumber(
  fields: Record<string, string>,
  key: string
): number | undefined {
  const raw = fields[key]?.trim();
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
