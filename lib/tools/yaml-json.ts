import { parse, stringify } from "yaml";

export function yamlToJson(input: string): { result: string; error?: string } {
  try {
    const parsed = parse(input);
    return { result: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    return { result: "", error: "YAML inválido: " + (e as Error).message };
  }
}

export function jsonToYaml(input: string): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(input) as unknown;
    return { result: stringify(parsed, { indent: 2, lineWidth: 0 }) };
  } catch (e) {
    return { result: "", error: "JSON inválido: " + (e as Error).message };
  }
}
