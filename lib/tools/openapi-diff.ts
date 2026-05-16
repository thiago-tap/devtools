import { parse as parseYaml } from "yaml";

type OpenApiDoc = { paths?: Record<string, Record<string, unknown>> };
const METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

export function parseOpenApi(input: string): OpenApiDoc {
  return (input.trim().startsWith("{") ? JSON.parse(input) : parseYaml(input)) as OpenApiDoc;
}

export function diffOpenApi(beforeText: string, afterText: string): string[] {
  const before = parseOpenApi(beforeText);
  const after = parseOpenApi(afterText);
  const changes: string[] = [];

  for (const [path, methods] of Object.entries(before.paths ?? {})) {
    const afterMethods = after.paths?.[path];
    if (!afterMethods) {
      changes.push(`BREAKING: path removido ${path}`);
      continue;
    }

    for (const method of METHODS) {
      if (methods[method] && !afterMethods[method]) {
        changes.push(`BREAKING: método removido ${method.toUpperCase()} ${path}`);
      }
    }
  }

  return changes.length ? changes : ["Nenhum breaking change básico detectado."];
}

export function openApiToRequests(input: string): Array<{ method: string; path: string }> {
  const doc = parseOpenApi(input);
  return Object.entries(doc.paths ?? {}).flatMap(([path, methods]) =>
    METHODS.filter((method) => methods[method]).map((method) => ({ method: method.toUpperCase(), path })),
  );
}
