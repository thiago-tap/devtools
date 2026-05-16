type JsonType = "string" | "number" | "integer" | "boolean" | "null" | "array" | "object";

function typeOf(value: unknown): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value as JsonType;
}

export function inferJsonSchema(value: unknown): Record<string, unknown> {
  const type = typeOf(value);
  if (type === "object") {
    const obj = value as Record<string, unknown>;
    return {
      type: "object",
      required: Object.keys(obj),
      properties: Object.fromEntries(Object.entries(obj).map(([key, child]) => [key, inferJsonSchema(child)])),
    };
  }
  if (type === "array") {
    const [first] = value as unknown[];
    return { type: "array", items: first === undefined ? {} : inferJsonSchema(first) };
  }
  return { type };
}

export function schemaToTypeScript(name: string, schema: Record<string, unknown>): string {
  if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
    const properties = Object.entries(schema.properties as Record<string, Record<string, unknown>>)
      .map(([key, child]) => `  ${key}: ${typeScriptType(child)};`)
      .join("\n");
    return `interface ${name} {\n${properties}\n}`;
  }
  return `type ${name} = ${typeScriptType(schema)};`;
}

function typeScriptType(schema: Record<string, unknown>): string {
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "array") return `${typeScriptType((schema.items as Record<string, unknown>) ?? {})}[]`;
  if (schema.type === "object") return "Record<string, unknown>";
  if (schema.type === "null") return "null";
  return "string";
}

export function schemaToZod(schema: Record<string, unknown>): string {
  if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
    const fields = Object.entries(schema.properties as Record<string, Record<string, unknown>>)
      .map(([key, child]) => `  ${key}: ${zodType(child)},`)
      .join("\n");
    return `z.object({\n${fields}\n})`;
  }
  return zodType(schema);
}

function zodType(schema: Record<string, unknown>): string {
  if (schema.type === "integer") return "z.number().int()";
  if (schema.type === "number") return "z.number()";
  if (schema.type === "boolean") return "z.boolean()";
  if (schema.type === "array") return `z.array(${zodType((schema.items as Record<string, unknown>) ?? {})})`;
  if (schema.type === "object") return "z.record(z.unknown())";
  if (schema.type === "null") return "z.null()";
  return "z.string()";
}
