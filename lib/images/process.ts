import sharp from "sharp";
import {
  applyColorKnockout,
  applyColorKnockoutEdgeFlood,
  colorDistance,
  parseHexColor,
  type Rgb,
} from "@/lib/images/color";
import {
  DEFAULT_DPI,
  DEFAULT_KNOCKOUT_TOLERANCE,
  type OutputFormat,
} from "@/lib/images/constants";
import { halftoneImage, type HalftoneMode } from "@/lib/images/halftone";
import { rasterToEpsPotrace, rasterToSvgPotrace } from "@/lib/images/vectorize";

export type { HalftoneMode } from "@/lib/images/halftone";

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

  const pipeline = sharp(input).rotate().withMetadata({ density: dpi });

  switch (opts.format) {
    case "jpeg":
      return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    case "webp":
      return pipeline.webp({ quality }).toBuffer();
    case "avif":
      return pipeline.avif({ quality, effort: 6 }).toBuffer();
    case "tiff":
      return pipeline.tiff({ compression: "lzw", quality }).toBuffer();
    case "png8":
      return pipeline.png({ palette: true, colors: 256, effort: 10 }).toBuffer();
    case "png":
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

/** Fundo da cor-chave ligado à moldura (recomendado para cartões roxo + texto preto). */
export async function knockoutColorEdgeFlood(
  input: Buffer,
  opts: KnockoutOptions
): Promise<Buffer> {
  const target = parseHexColor(opts.color);
  if (!target) throw new Error("Cor inválida. Use HEX, ex: #000000");

  const tolerance = opts.tolerance ?? DEFAULT_KNOCKOUT_TOLERANCE;
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  applyColorKnockoutEdgeFlood(data, info.width, info.height, target, tolerance);

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

/** Meio-tom (Bayer 4×4 ou Floyd–Steinberg) → PNG 1 bit visual. */
export async function halftoneRaster(
  input: Buffer,
  opts: { mode: HalftoneMode; dpi?: number }
): Promise<Buffer> {
  return halftoneImage(input, opts);
}

/** Monocromático → SVG (potrace no servidor). */
export async function vectorizeToSvg(
  input: Buffer,
  opts: { threshold?: number; turdsize?: number }
): Promise<Buffer> {
  return rasterToSvgPotrace(input, opts);
}

/** Monocromático → EPS (potrace `-e`). */
export async function vectorizeToEps(
  input: Buffer,
  opts: { threshold?: number; turdsize?: number }
): Promise<Buffer> {
  return rasterToEpsPotrace(input, opts);
}

/** Canal alfa como PNG em tons de cinza (máscara de tinta). */
export async function alphaMaskGrayscale(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().ensureAlpha().extractChannel("alpha").png().toBuffer();
}

/** Inverte RGB mantendo o alfa (útil para chapa / prova). */
export async function invertRgbKeepAlpha(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]!;
    data[i + 1] = 255 - data[i + 1]!;
    data[i + 2] = 255 - data[i + 2]!;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Preset silk: halftone + resize opcional em cm. */
export async function presetSilk(
  input: Buffer,
  opts: { widthCm?: number; heightCm?: number; dpi?: number; halftoneMode?: HalftoneMode }
): Promise<Buffer> {
  const mode = opts.halftoneMode ?? "floyd";
  let buf = await halftoneImage(input, { mode, dpi: opts.dpi ?? DEFAULT_DPI });
  if (opts.widthCm || opts.heightCm) {
    buf = await resizeImage(buf, {
      widthCm: opts.widthCm,
      heightCm: opts.heightCm,
      dpi: opts.dpi ?? DEFAULT_DPI,
    });
  }
  return buf;
}

