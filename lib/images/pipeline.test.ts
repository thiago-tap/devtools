import { describe, expect, it } from "vitest";
import { parsePipelineJson, pipelineNeedsRembg } from "./pipeline";

describe("pipeline", () => {
  it("parsePipelineJson accepts resize + halftone", () => {
    const steps = parsePipelineJson(
      JSON.stringify([{ action: "resize", widthCm: "10", dpi: "300" }, { action: "halftone", mode: "floyd" }])
    );
    expect(steps).toHaveLength(2);
    expect(steps[0]?.action).toBe("resize");
    expect(pipelineNeedsRembg(steps)).toBe(false);
  });

  it("pipelineNeedsRembg detects remove_bg", () => {
    const steps = parsePipelineJson(JSON.stringify([{ action: "remove_bg" }]));
    expect(pipelineNeedsRembg(steps)).toBe(true);
  });

  it("parsePipelineJson accepts proof_pdf step", () => {
    const steps = parsePipelineJson(JSON.stringify([{ action: "proof_pdf" }]));
    expect(steps[0]?.action).toBe("proof_pdf");
  });

  it("parsePipelineJson accepts convert avif", () => {
    const steps = parsePipelineJson(
      JSON.stringify([{ action: "convert", format: "avif", quality: "80" }])
    );
    expect(steps[0]?.format).toBe("avif");
  });

  it("rejects unknown action", () => {
    expect(() => parsePipelineJson(JSON.stringify([{ action: "hack" }]))).toThrow();
  });
});
