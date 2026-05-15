import { describe, expect, it } from "vitest";
import {
  applyColorKnockout,
  applyColorKnockoutEdgeFlood,
  canFloodThroughPixel,
  colorDistance,
  parseHexColor,
  type Rgb,
} from "./color";

describe("color", () => {
  it("parseHexColor", () => {
    expect(parseHexColor("#000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHexColor("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseHexColor("invalid")).toBeNull();
  });

  it("knockout removes matching pixels", () => {
    const data = Buffer.from([
      0, 0, 0, 255, // black
      255, 255, 255, 255, // white
    ]);
    applyColorKnockout(data, 2, 1, { r: 0, g: 0, b: 0 }, 10, { fringePasses: 0 });
    expect(data[3]).toBe(0);
    expect(data[7]).toBe(255);
    expect(colorDistance({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 })).toBeLessThan(3);
  });

  it("knockout fringe removes purple+black anti-alias next to keyed area", () => {
    const key = { r: 147, g: 73, b: 255 }; // ~#9349FF
    const blend: [number, number, number] = [37, 18, 64];
    const data = Buffer.from([
      key.r,
      key.g,
      key.b,
      255,
      ...blend,
      255,
      0,
      0,
      0,
      255,
    ]);
    applyColorKnockout(data, 3, 1, key, 40);
    expect(data[3]).toBe(0);
    expect(data[7]).toBe(0);
    expect(data[11]).toBe(255);
  });

  it("knockout fringe keeps light anti-alias of small dark text", () => {
    const key = { r: 147, g: 73, b: 255 };
    const lightAa: [number, number, number] = [100, 50, 150];
    const data = Buffer.from([
      key.r,
      key.g,
      key.b,
      255,
      ...lightAa,
      255,
      0,
      0,
      0,
      255,
    ]);
    applyColorKnockout(data, 3, 1, key, 40);
    expect(data[3]).toBe(0);
    expect(data[7]).toBe(255);
    expect(data[11]).toBe(255);
  });

  it("canFloodThroughPixel blocks anti-alias closer to black than key", () => {
    const key = { r: 147, g: 73, b: 255 };
    expect(canFloodThroughPixel(key, key, 40)).toBe(true);
    expect(canFloodThroughPixel({ r: 0, g: 0, b: 0 }, key, 40)).toBe(false);
    const aa: Rgb = { r: 100, g: 50, b: 150 };
    expect(canFloodThroughPixel(aa, key, 120)).toBe(false);
  });

  it("edge flood clears border key but not enclosed black", () => {
    const key = { r: 147, g: 73, b: 255 };
    const w = 6;
    const h = 6;
    const data = Buffer.alloc(w * h * 4, 0);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const edge = x === 0 || x === w - 1 || y === 0 || y === h - 1;
        if (edge) {
          data[i] = key.r;
          data[i + 1] = key.g;
          data[i + 2] = key.b;
          data[i + 3] = 255;
        } else {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }
      }
    }
    applyColorKnockoutEdgeFlood(data, w, h, key, 40, { fringePasses: 0 });
    const center = (2 * w + 2) * 4;
    expect(data[center + 3]).toBe(255);
    const corner = 0;
    expect(data[corner + 3]).toBe(0);
  });
});
