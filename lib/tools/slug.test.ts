import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Olá Mundo")).toBe("ola-mundo");
  });

  it("remove pontuação e colapsa hífens", () => {
    expect(slugify("  Foo---Bar!!!  ")).toBe("foo-bar");
  });

  it("fallback quando vazio", () => {
    expect(slugify("   ")).toBe("item");
    expect(slugify("---")).toBe("item");
  });

  it("respeita maxLen", () => {
    const long = "a".repeat(200);
    expect(slugify(long, 10).length).toBeLessThanOrEqual(10);
  });
});
