import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { halftoneImage } from "./halftone";

describe("halftone", () => {
  it("ordered4 returns PNG buffer", async () => {
    const w = 8;
    const h = 8;
    const data = Buffer.alloc(w * h * 4, 0);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 200;
      data[i + 1] = 200;
      data[i + 2] = 200;
      data[i + 3] = 255;
    }
    const input = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toBuffer();
    const png = await halftoneImage(input, { mode: "ordered4" });
    expect(png.length).toBeGreaterThan(40);
  });
});
