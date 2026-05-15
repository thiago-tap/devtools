import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";

export async function buildProofPdf(
  input: Buffer,
  opts: { fileLabel?: string }
): Promise<Buffer> {
  const label = opts.fileLabel?.trim() || "imagem";
  const sharpMeta = await sharp(input).metadata();
  const width = sharpMeta.width ?? 0;
  const height = sharpMeta.height ?? 0;
  const density = sharpMeta.density && sharpMeta.density > 0 ? sharpMeta.density : 72;
  const widthCm = width > 0 ? Math.round(((width / density) * 2.54) * 10) / 10 : null;
  const heightCm = height > 0 ? Math.round(((height / density) * 2.54) * 10) / 10 : null;

  const thumb = await sharp(input)
    .rotate()
    .resize({ width: 440, height: 440, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const embedded = await pdf.embedPng(thumb);
  const scale = Math.min(440 / embedded.width, 520 / embedded.height, 1);
  const w = embedded.width * scale;
  const h = embedded.height * scale;
  const imgX = 40;
  const imgY = 841.89 - h - 72;
  page.drawImage(embedded, { x: imgX, y: imgY, width: w, height: h });

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const lines = [
    `DevToolbox — prova de arte`,
    `Ficheiro: ${label}`,
    `Dimensão: ${width}×${height}px`,
    `Densidade: ${density} DPI`,
    widthCm != null && heightCm != null ? `Tamanho aprox.: ${widthCm}×${heightCm} cm` : null,
    `Formato original: ${sharpMeta.format ?? "unknown"}`,
  ].filter((x): x is string => x != null);

  let y = imgY - 16;
  for (const line of lines) {
    page.drawText(line, { x: 40, y, size: 11, font, color: rgb(0.12, 0.12, 0.12) });
    y -= 16;
  }

  page.drawText("As cores no ecrã podem diferir da impressão final.", {
    x: 40,
    y: 48,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return Buffer.from(await pdf.save());
}
