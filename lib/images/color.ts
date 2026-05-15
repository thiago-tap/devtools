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
        const dTarget = colorDistance(pixel, target);
        if (dTarget > fringeTol) continue;

        if (preserveLikelySmallTextStroke(pixel, target)) continue;
        if (preserveNearBlackCore(pixel)) continue;
        if (darkOpaqueNeighborCount(data, width, height, x, y) >= 2) continue;

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
  return Math.min(238, baseTolerance + span * 0.68);
}

function luminance(p: Rgb): number {
  return 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
}

/**
 * Letras pequenas às vezes só existem como anti-alias “claro” (média preto+fundo).
 * A regra antiga comia esses pixels; aqui protegemos esse tipo de mistura.
 */
function preserveLikelySmallTextStroke(pixel: Rgb, target: Rgb): boolean {
  const dTarget = colorDistance(pixel, target);
  const lum = luminance(pixel);
  return lum > 58 && dTarget < 142;
}

/** Núcleo preto/cinza do traço — não expandir franja por cima (limiar apertado para não confundir com halo). */
function preserveNearBlackCore(pixel: Rgb): boolean {
  const dBlack = colorDistance(pixel, RGB_BLACK);
  return dBlack < 58 && luminance(pixel) < 74;
}

function darkOpaqueNeighborCount(
  data: Buffer,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  let count = 0;
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const;
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const j = (ny * width + nx) * 4;
    if (data[j + 3] === 0) continue;
    const p: Rgb = { r: data[j], g: data[j + 1], b: data[j + 2] };
    if (luminance(p) < 52) count += 1;
  }
  return count;
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

  const fringePasses = opts?.fringePasses ?? 3;
  if (fringePasses <= 0) return;

  const fringeTol = fringeToleranceForTarget(target, tolerance);
  applyKnockoutFringePasses(data, width, height, target, fringeTol, fringePasses);
}

/**
 * Pode propagar inundação por este pixel? Roxo “cheio” sim; anti-alias na borda do texto
 * (mais próximo do preto) não — evita comer traços finos. Halos escuros roxo+preto entram
 * na fase seguinte (franja).
 */
export function canFloodThroughPixel(pixel: Rgb, key: Rgb, tolerance: number): boolean {
  if (colorDistance(pixel, key) > tolerance) return false;
  const dBlack = colorDistance(pixel, RGB_BLACK);
  const dKey = colorDistance(pixel, key);
  if (dBlack < 42) return false;
  const lum = luminance(pixel);
  if (lum < 108 && dBlack < dKey + 72) return false;
  return true;
}

/**
 * Remove fundo conectado à **moldura** da imagem (4-vizinhos), sem apagar ilhas do mesmo
 * tom no interior (ex.: buraco de “O” com o mesmo roxo — ver documentação na UI).
 * Depois aplica a mesma limpeza de franja que `applyColorKnockout`.
 */
export function applyColorKnockoutEdgeFlood(
  data: Buffer,
  width: number,
  height: number,
  target: Rgb,
  tolerance: number,
  opts?: { fringePasses?: number }
): void {
  const n = width * height;
  const visited = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;

  const pixelAt = (p: number): Rgb => {
    const i = p * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };

  const tryEnqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * 4;
    if (data[i + 3] === 0) {
      visited[p] = 1;
      return;
    }
    const rgb = pixelAt(p);
    if (!canFloodThroughPixel(rgb, target, tolerance)) return;
    visited[p] = 1;
    queue[tail++] = p;
  };

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  while (head < tail) {
    const p = queue[head++]!;
    const i = p * 4;
    data[i + 3] = 0;
    const x = p % width;
    const y = (p / width) | 0;
    if (x > 0) tryEnqueue(x - 1, y);
    if (x + 1 < width) tryEnqueue(x + 1, y);
    if (y > 0) tryEnqueue(x, y - 1);
    if (y + 1 < height) tryEnqueue(x, y + 1);
  }

  const fringePasses = opts?.fringePasses ?? 3;
  if (fringePasses <= 0) return;
  const fringeTol = fringeToleranceForTarget(target, tolerance);
  applyKnockoutFringePasses(data, width, height, target, fringeTol, fringePasses);
}
