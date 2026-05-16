import { describe, expect, it } from "vitest";
import { inferJsonSchema, schemaToTypeScript, schemaToZod } from "./schema-infer";

describe("schema inference", () => {
  it("infers object schema and outputs types", () => {
    const schema = inferJsonSchema({ id: 1, name: "Ana", active: true });
    expect(schema).toMatchObject({ type: "object" });
    expect(schemaToTypeScript("User", schema)).toContain("interface User");
    expect(schemaToZod(schema)).toContain("z.object");
  });
});
