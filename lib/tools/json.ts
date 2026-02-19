export function formatJSON(input: string, indent = 2): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(input);
    return { result: JSON.stringify(parsed, null, indent) };
  } catch (e) {
    return { result: "", error: (e as Error).message };
  }
}

export function minifyJSON(input: string): { result: string; error?: string } {
  try {
    return { result: JSON.stringify(JSON.parse(input)) };
  } catch (e) {
    return { result: "", error: (e as Error).message };
  }
}

export function jsonToTypeScript(input: string): { result: string; error?: string } {
  try {
    const obj = JSON.parse(input);
    return { result: generateInterface(obj, "Root") };
  } catch (e) {
    return { result: "", error: (e as Error).message };
  }
}

function generateInterface(obj: unknown, name: string): string {
  if (typeof obj !== "object" || obj === null) return "";

  const lines: string[] = [];
  const nested: string[] = [];

  lines.push(`export interface ${name} {`);

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const type = inferType(value, key, nested);
    lines.push(`  ${key}: ${type};`);
  }

  lines.push("}");
  return [...lines, ...nested].join("\n");
}

function inferType(value: unknown, key: string, nested: string[]): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const itemType = inferType(value[0], key, nested);
    return `${itemType}[]`;
  }
  if (typeof value === "object") {
    const interfaceName = key.charAt(0).toUpperCase() + key.slice(1);
    nested.push("\n" + generateInterface(value, interfaceName));
    return interfaceName;
  }
  return typeof value;
}

export function validateJSON(input: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}
