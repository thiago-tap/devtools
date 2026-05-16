import { describe, expect, it } from "vitest";
import { signJwtHS256 } from "./jwt-sign";

function decodePayloadPart(token: string): Record<string, unknown> {
  const parts = token.split(".");
  expect(parts.length).toBe(3);
  const p = parts[1]!;
  const pad = p.length % 4 === 0 ? "" : "=".repeat(4 - (p.length % 4));
  const b64 = p.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, unknown>;
}

describe("signJwtHS256", () => {
  it("produz três segmentos e payload preservado", () => {
    const payload = { sub: "u1", n: 42 };
    const token = signJwtHS256(payload, "my-secret");
    expect(token.split(".")).toHaveLength(3);
    const decoded = decodePayloadPart(token);
    expect(decoded.sub).toBe("u1");
    expect(decoded.n).toBe(42);
  });

  it("mesmo payload e secret produzem mesma assinatura", () => {
    const a = signJwtHS256({ x: 1 }, "k");
    const b = signJwtHS256({ x: 1 }, "k");
    expect(a).toBe(b);
  });
});
