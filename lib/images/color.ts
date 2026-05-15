export type Rgb = { r: number; g: number; b: number };

export function parseHexColor(input: string): Rgb | null {
  const hex = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;

  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Distância euclidiana RGB (0–441). */
export function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

const RGB_BLACK: Rgb = { r: 0, g: 0, b: 0 };
const RGB_WHITE: Rgb = { r: 255, g: 255, b: 255 };

/**
 * Após remover a cor sólida, bordas anti-alias ficam como misturas (ex.: roxo+preto).
 * Estão longe do HEX amostrado mas ainda "roxo" — esta passagem só remove pixels que
 * (1) ainda são parecidos com a chave dentro de `fringeTol` e (2) tocam pixel já transparente.
 */
function applyKnockoutFringePasses(
  data: Buffer,
  width: number,
  height: number,
  target: Rgb,
  fringeTol: number,
  passes: number
): void {
  for (let pass = 0; pass < passes; pass++) {
    const toClear: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] === 0) continue;

        const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
        const nearKey = colorDistance(pixel, target) <= fringeTol;
        const darkFringe = isKeyBlackAntiAliasFringe(pixel, target, 48);
        if (!nearKey && !darkFringe) continue;

        const transparentNeighbor =
          (x > 0 && data[i - 4 + 3] === 0) ||
          (x < width - 1 && data[i + 4 + 3] === 0) ||
          (y > 0 && data[i - width * 4 + 3] === 0) ||
          (y < height - 1 && data[i + width * 4 + 3] === 0);

        if (transparentNeighbor) {
          toClear.push(i);
        }
      }
    }
    if (toClear.length === 0) break;
    for (const i of toClear) {
      data[i + 3] = 0;
    }
  }
}

/**
 * Misturas anti-alias (chave + preto) ficam mais escuras que a chave e podem exceder
 * tolerância em relação ao HEX — usamos distância ao preto/branco para ampliar o raio.
 */
function fringeToleranceForTarget(target: Rgb, baseTolerance: number): number {
  const span = Math.max(
    colorDistance(target, RGB_BLACK),
    colorDistance(target, RGB_WHITE)
  );
  return Math.min(290, baseTolerance + span * 0.78);
}

function luminance(p: Rgb): number {
  return 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
}

/**
 * Borda texto preto + fundo roxo: pixel pode estar mais perto do preto que do roxo,
 * mas ainda ser resíduo da chave — removemos se for escuro e "quase tão roxo quanto preto".
 */
function isKeyBlackAntiAliasFringe(pixel: Rgb, target: Rgb, band: number): boolean {
  const dTarget = colorDistance(pixel, target);
  const dBlack = colorDistance(pixel, RGB_BLACK);
  return (
    dTarget < dBlack + band &&
    luminance(pixel) < 200 &&
    dTarget < 265
  );
}

export function applyColorKnockout(
  data: Buffer,
  width: number,
  height: number,
  target: Rgb,
  tolerance: number,
  opts?: { fringePasses?: number }
): void {
  for (let i = 0; i < data.length; i += 4) {
    const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (colorDistance(pixel, target) <= tolerance) {
      data[i + 3] = 0;
    }
  }

  const fringePasses = opts?.fringePasses ?? 4;
  if (fringePasses <= 0) return;

  const fringeTol = fringeToleranceForTarget(target, tolerance);
  applyKnockoutFringePasses(data, width, height, target, fringeTol, fringePasses);
}
