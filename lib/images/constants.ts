export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? "25");
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const OUTPUT_FORMATS = ["png", "jpeg", "webp"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export const DEFAULT_DPI = 300;
export const DEFAULT_KNOCKOUT_TOLERANCE = 40;
