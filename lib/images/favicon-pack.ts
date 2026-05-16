import JSZip from "jszip";
import sharp from "sharp";

const SIZES = [16, 32, 48, 64, 128, 180, 192, 512] as const;

/** Remove metadados EXIF/ICC re-encodando (mantém pixels). */
export async function stripImageMetadata(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

export async function faviconZipFromImage(input: Buffer): Promise<Buffer> {
  const zip = new JSZip();
  for (const w of SIZES) {
    const png = await sharp(input)
      .rotate()
      .resize(w, w, { fit: "cover", position: "attention" })
      .png()
      .toBuffer();
    zip.file(`favicon-${w}x${w}.png`, png);
  }
  zip.file(
    "README.txt",
    "PNG em vários tamanhos para favicon / PWA / Apple Touch Icon.\n"
  );
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}
