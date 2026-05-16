import { describe, expect, it } from "vitest";
import { compareEnvFiles } from "./env-toolkit";

describe("compareEnvFiles", () => {
  it("detects missing and empty keys", () => {
    const result = compareEnvFiles("A=1\nB=\nA=2", "A=\nC=");
    expect(result.missingInEnv).toEqual(["C"]);
    expect(result.missingInExample).toEqual(["B"]);
    expect(result.emptyValues).toEqual(["B"]);
    expect(result.duplicateKeys).toEqual(["A"]);
  });
});
