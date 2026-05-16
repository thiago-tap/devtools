import { describe, expect, it } from "vitest";
import { validateJsonSchema } from "./json-schema-validator";

describe("validateJsonSchema", () => {
  it("valida required, enum, minLength e nested objects", () => {
    const schema = {
      type: "object",
      required: ["name", "role"],
      properties: {
        name: { type: "string", minLength: 3 },
        role: { enum: ["admin", "user"] },
        profile: {
          type: "object",
          properties: { age: { type: "integer", minimum: 18 } },
        },
      },
    };

    expect(validateJsonSchema(schema, { name: "Ana", role: "admin", profile: { age: 20 } })).toEqual([]);
    expect(validateJsonSchema(schema, { name: "Al", role: "root", profile: { age: 17 } })).toEqual([
      "$.name: tamanho mínimo 3",
      "$.role: valor fora do enum",
      "$.profile.age: mínimo 18",
    ]);
  });

  it("valida arrays e formatos básicos", () => {
    const schema = { type: "array", items: { type: "string", format: "email" } };
    expect(validateJsonSchema(schema, ["a@example.com", "invalid"])).toEqual(["$[1]: email inválido"]);
  });
});
