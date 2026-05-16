import { describe, expect, it } from "vitest";
import { signJwtHS256 } from "./jwt-sign";
import { verifyJwtHS256 } from "./jwt-verify";

describe("verifyJwtHS256", () => {
  it("aceita token assinado com o secret correto", () => {
    const token = signJwtHS256({ sub: "123" }, "secret");

    expect(verifyJwtHS256(token, "secret")).toEqual({ ok: true });
  });

  it("rejeita token assinado com outro secret", () => {
    const token = signJwtHS256({ sub: "123" }, "secret");

    expect(verifyJwtHS256(token, "wrong")).toEqual({ ok: false, error: "Assinatura HS256 inválida." });
  });
});
