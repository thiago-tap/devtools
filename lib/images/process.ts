import sharp from "sharp";
import {
  applyColorKnockout,
  colorDistance,
  parseHexColor,
  type Rgb,
} from "@/lib/images/color";
import {
  DEFAULT_DPI,
  DEFAULT_KNOCKOUT_TOLERANCE,
  type OutputFormat,
} from "@/lib/images/constants";

export type ImageMetadata = {
  width: number;
  height: number;
  format: string;
  density: number;
  widthCm: number | null;
  heightCm: number | null;
};

export async function getImageMetadata(input: Buffer): Promise<ImageMetadata> {
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const density = meta.density && meta.density > 0 ? meta.density : 72;
  const widthCm = width > 0 ? (width / density) * 2.54 : null;
  const heightCm = height > 0 ? (height / density) * 2.54 : null;

  return {
    width,
    height,
    format: meta.format ?? "unknown",
    density,
    widthCm: widthCm ? Math.round(widthCm * 10) / 10 : null,
    heightCm: heightCm ? Math.round(heightCm * 10) / 10 : null,
  };
}

export type ResizeOptions = {
  widthPx?: number;
  heightPx?: number;
  widthCm?: number;
  heightCm?: number;
  dpi?: number;
};

export async function resizeImage(input: Buffer, opts: ResizeOptions): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const dpi = opts.dpi ?? DEFAULT_DPI;
  let targetW = opts.widthPx;
  let targetH = opts.heightPx;

  if (opts.widthCm && meta.width && meta.height) {
    targetW = Math.round((opts.widthCm / 2.54) * dpi);
    if (!opts.heightCm) {
      targetH = Math.round((targetW / meta.width) * meta.height);
    }
  }
  if (opts.heightCm && meta.width && meta.height) {
    targetH = Math.round((opts.heightCm / 2.54) * dpi);
    if (!opts.widthCm) {
      targetW = Math.round((targetH / meta.height) * meta.width);
    }
  }

  let pipeline = sharp(input).rotate();
  if (targetW || targetH) {
    pipeline = pipeline.resize(targetW, targetH, {
      fit: "inside",
      withoutEnlargement: false,
    });
  }

  return pipeline.withMetadata({ density: dpi }).png().toBuffer();
}

export type ConvertOptions = {
  format: OutputFormat;
  quality?: number;
  dpi?: number;
};

export async function convertImage(input: Buffer, opts: ConvertOptions): Promise<Buffer> {
  const dpi = opts.dpi ?? DEFAULT_DPI;
  const quality = opts.quality ?? 90;

  let pipeline = sharp(input).rotate().withMetadata({ density: dpi });

  switch (opts.format) {
    case "jpeg":
      return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    case "webp":
      return pipeline.webp({ quality }).toBuffer();
    default:
      return pipeline.png().toBuffer();
  }
}

export type KnockoutOptions = {
  color: string;
  tolerance?: number;
};

export async function knockoutColor(input: Buffer, opts: KnockoutOptions): Promise<Buffer> {
  const target = parseHexColor(opts.color);
  if (!target) throw new Error("Cor inválida. Use HEX, ex: #000000");

  const tolerance = opts.tolerance ?? DEFAULT_KNOCKOUT_TOLERANCE;
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  applyColorKnockout(data, info.width, info.height, target, tolerance);

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Remove pretos e cinzas escuros (atalho para camisa preta). */
export async function knockoutDarkColors(
  input: Buffer,
  tolerance = DEFAULT_KNOCKOUT_TOLERANCE
): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const black: Rgb = { r: 0, g: 0, b: 0 };
  for (let i = 0; i < data.length; i += 4) {
    const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const lum = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
    if (colorDistance(pixel, black) <= tolerance || lum < tolerance * 0.6) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

export async function presetDtf(
  input: Buffer,
  opts: { widthCm?: number; heightCm?: number; dpi?: number }
): Promise<Buffer> {
  return resizeImage(input, {
    widthCm: opts.widthCm,
    heightCm: opts.heightCm,
    dpi: opts.dpi ?? DEFAULT_DPI,
  });
}

export async function presetBlackShirt(
  input: Buffer,
  opts: { widthCm?: number; dpi?: number; tolerance?: number }
): Promise<Buffer> {
  let buf = await knockoutDarkColors(input, opts.tolerance);
  if (opts.widthCm) {
    buf = await resizeImage(buf, { widthCm: opts.widthCm, dpi: opts.dpi ?? DEFAULT_DPI });
  }
  return buf;
}

export function mimeForFormat(format: OutputFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

export function extensionForFormat(format: OutputFormat): string {
  return format === "jpeg" ? "jpg" : format;
}
