import { describe, expect, it } from "vitest";
import { generateSecret, generateSecrets } from "./secrets";

describe("secrets", () => {
  it("generates hex of correct length", () => {
    expect(generateSecret(32, "hex")).toHaveLength(64);
  });

  it("generates base64 output", () => {
    const s = generateSecret(32, "base64");
    expect(s.length).toBeGreaterThan(40);
    expect(s).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("generates unique values", () => {
    const batch = generateSecrets(5, 16, "hex");
    expect(new Set(batch).size).toBe(5);
  });
});
