import { describe, expect, it } from "vitest";
import { applyColorKnockout, colorDistance, parseHexColor } from "./color";

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
});
