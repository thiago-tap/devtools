export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? "25");
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const OUTPUT_FORMATS = ["png", "jpeg", "webp", "avif", "tiff", "png8"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

/** Converte campo `format` (API / pipeline) para `OutputFormat`. */
export function parseOutputFormat(raw: string | undefined): OutputFormat {
  const f = raw?.toLowerCase().trim();
  switch (f) {
    case "jpeg":
    case "jpg":
      return "jpeg";
    case "webp":
      return "webp";
    case "avif":
      return "avif";
    case "tiff":
    case "tif":
      return "tiff";
    case "png8":
    case "png-palette":
      return "png8";
    case "png":
    default:
      return "png";
  }
}

export const DEFAULT_DPI = 300;
export const DEFAULT_KNOCKOUT_TOLERANCE = 40;

/** MIME e extensão para `Content-Disposition` em downloads raster. */
export function rasterDownloadParts(format: OutputFormat): { contentType: string; ext: string } {
  switch (format) {
    case "jpeg":
      return { contentType: "image/jpeg", ext: "jpg" };
    case "webp":
      return { contentType: "image/webp", ext: "webp" };
    case "avif":
      return { contentType: "image/avif", ext: "avif" };
    case "tiff":
      return { contentType: "image/tiff", ext: "tiff" };
    case "png8":
    case "png":
      return { contentType: "image/png", ext: "png" };
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}
