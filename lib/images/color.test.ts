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
    applyColorKnockout(data, 2, 1, { r: 0, g: 0, b: 0 }, 10);
    expect(data[3]).toBe(0);
    expect(data[7]).toBe(255);
    expect(colorDistance({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 })).toBeLessThan(3);
  });
});
