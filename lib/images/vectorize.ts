import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

function toPbmP4(grey: Uint8Array, width: number, height: number, threshold: number): Buffer {
  const rowBytes = Math.ceil(width / 8);
  const body = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lum = grey[y * width + x]!;
      const black = lum < threshold;
      if (black) {
        const bi = y * rowBytes + (x >> 3);
        body[bi]! |= 0x80 >> (x & 7);
      }
    }
  }
  const header = Buffer.from(`P4\n${width} ${height}\n`);
  return Buffer.concat([header, body]);
}

/**
 * Raster → SVG via **potrace** (monocromático). Requer `potrace` no PATH (Dockerfile do app).
 */
export async function rasterToSvgPotrace(
  input: Buffer,
  opts: { threshold?: number; turdsize?: number }
): Promise<Buffer> {
  const threshold = opts.threshold ?? 128;
  const turdsize = opts.turdsize ?? 2;

  const { data, info } = await sharp(input)
    .rotate()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pbm = toPbmP4(data, width, height, threshold);

  const id = randomBytes(8).toString("hex");
  const dir = join(tmpdir(), `potrace-${id}`);
  const inPath = join(dir, "in.pbm");
  const outPath = join(dir, "out.svg");

  await mkdir(dir, { recursive: true });
  try {
    await writeFile(inPath, pbm);
    const bin = process.env.POTRACE_PATH?.trim() || "potrace";
    await execFileAsync(bin, ["-s", "-t", String(turdsize), "-o", outPath, inPath], {
      timeout: 120_000,
      maxBuffer: 32 * 1024 * 1024,
    });
    const svg = await readFile(outPath);
    return svg;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
