/** Import dinâmico — não carregar `yaml` no bundle do Worker (evita 500 no Cloudflare). */
async function loadYaml() {
  return import("yaml");
}

export async function yamlToJson(input: string): Promise<{ result: string; error?: string }> {
  try {
    const { parse } = await loadYaml();
    const parsed = parse(input);
    return { result: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    return { result: "", error: "YAML inválido: " + (e as Error).message };
  }
}

export async function jsonToYaml(input: string): Promise<{ result: string; error?: string }> {
  try {
    const parsed = JSON.parse(input) as unknown;
    const { stringify } = await loadYaml();
    return { result: stringify(parsed, { indent: 2, lineWidth: 0 }) };
  } catch (e) {
    return { result: "", error: "JSON inválido: " + (e as Error).message };
  }
}
