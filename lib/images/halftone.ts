import sharp from "sharp";

export type HalftoneMode = "ordered4" | "floyd";

const BAYER4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function luminanceWithWhiteBackground(
  r: number,
  g: number,
  b: number,
  a: number
): number {
  const al = a / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum * al + 255 * (1 - al);
}

/**
 * Meio-tom 1 bit (preto no branco) para silk / preview técnico.
 * `ordered4` — matriz Bayer 4×4 (rápido). `floyd` — Floyd–Steinberg (suave em degradês).
 */
export async function halftoneImage(
  input: Buffer,
  opts: { mode: HalftoneMode; dpi?: number }
): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const grey = new Float32Array(width * height);

  for (let i = 0, p = 0; p < width * height; i += 4, p++) {
    grey[p] = luminanceWithWhiteBackground(data[i], data[i + 1], data[i + 2], data[i + 3]);
  }

  const out = Buffer.alloc(width * height * 4);
  const dpi = opts.dpi;

  if (opts.mode === "floyd") {
    const buf = new Float32Array(grey);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        const old = buf[p]!;
        const nw = old < 128 ? 0 : 255;
        const err = old - nw;
        buf[p] = nw;
        if (x + 1 < width) buf[p + 1] += (err * 7) / 16;
        if (y + 1 < height) {
          if (x > 0) buf[p + width - 1] += (err * 3) / 16;
          buf[p + width] += (err * 5) / 16;
          if (x + 1 < width) buf[p + width + 1] += err / 16;
        }
      }
    }
    for (let p = 0, i = 0; p < width * height; p++, i += 4) {
      const v = Math.max(0, Math.min(255, Math.round(buf[p]!)));
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        const l = grey[p]! / 255;
        const t = (BAYER4[y & 3]![x & 3]! + 0.5) / 16;
        const v = l >= t ? 255 : 0;
        const i = p * 4;
        out[i] = v;
        out[i + 1] = v;
        out[i + 2] = v;
        out[i + 3] = 255;
      }
    }
  }

  let pipeline = sharp(out, {
    raw: { width, height, channels: 4 },
  }).png();

  if (dpi && dpi > 0) {
    pipeline = pipeline.withMetadata({ density: dpi });
  }

  return pipeline.toBuffer();
}
