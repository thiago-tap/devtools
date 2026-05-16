export type JsonSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  format?: "email" | "uri" | "date-time" | string;
};

function typeMatches(type: string, value: unknown): boolean {
  if (type === "array") return Array.isArray(value);
  if (type === "null") return value === null;
  if (type === "integer") return Number.isInteger(value);
  return typeof value === type;
}

function sameJsonValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatIsValid(format: string, value: string): boolean {
  if (format === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (format === "uri") return /^https?:\/\//i.test(value);
  if (format === "date-time") return !Number.isNaN(Date.parse(value));
  return true;
}

export function validateJsonSchema(schema: JsonSchema, value: unknown, path = "$"): string[] {
  const errors: string[] = [];

  if (schema.type && !typeMatches(schema.type, value)) {
    errors.push(`${path}: esperado ${schema.type}`);
    return errors;
  }

  if (schema.const !== undefined && !sameJsonValue(schema.const, value)) errors.push(`${path}: valor diferente de const`);
  if (schema.enum && !schema.enum.some((item) => sameJsonValue(item, value))) errors.push(`${path}: valor fora do enum`);

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: tamanho mínimo ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path}: tamanho máximo ${schema.maxLength}`);
    if (schema.format && !formatIsValid(schema.format, value)) errors.push(`${path}: ${schema.format} inválido`);
  }

  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: mínimo ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: máximo ${schema.maximum}`);
  }

  if (schema.type === "object" && schema.properties && value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) errors.push(`${path}.${key}: obrigatório`);
    }
    for (const [key, child] of Object.entries(schema.properties)) {
      if (key in obj) errors.push(...validateJsonSchema(child, obj[key], `${path}.${key}`));
    }
  }

  if (schema.type === "array" && schema.items && Array.isArray(value)) {
    const itemSchema = schema.items;
    value.forEach((item, index) => errors.push(...validateJsonSchema(itemSchema, item, `${path}[${index}]`)));
  }

  return errors;
}
