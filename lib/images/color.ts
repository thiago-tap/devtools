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

export function applyColorKnockout(
  data: Buffer,
  width: number,
  height: number,
  target: Rgb,
  tolerance: number
): void {
  for (let i = 0; i < data.length; i += 4) {
    const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (colorDistance(pixel, target) <= tolerance) {
      data[i + 3] = 0;
    }
  }
}
