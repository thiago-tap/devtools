export interface EnvLine {
  key: string;
  value: string;
  comment?: string;
  lineNumber: number;
}

export function parseEnvLines(content: string): { lines: EnvLine[]; errors: string[] } {
  const lines: EnvLine[] = [];
  const errors: string[] = [];

  content.split("\n").forEach((raw, index) => {
    const lineNumber = index + 1;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const eq = raw.indexOf("=");
    if (eq === -1) {
      errors.push(`Linha ${lineNumber}: esperado KEY=VALUE`);
      return;
    }

    const key = raw.slice(0, eq).trim();
    let value = raw.slice(eq + 1);

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors.push(`Linha ${lineNumber}: chave inválida "${key}"`);
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    lines.push({ key, value, lineNumber });
  });

  return { lines, errors };
}

export function formatEnv(content: string, sortKeys: boolean): { result: string; errors: string[] } {
  const { lines, errors } = parseEnvLines(content);
  if (errors.length) return { result: content, errors };

  const ordered = sortKeys
    ? [...lines].sort((a, b) => a.key.localeCompare(b.key))
    : lines;

  const result = ordered.map((l) => `${l.key}=${l.value}`).join("\n");
  return { result, errors: [] };
}

export function maskEnvSecrets(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      const eq = line.indexOf("=");
      if (eq === -1) return line;
      const key = line.slice(0, eq);
      const lower = key.toLowerCase();
      const sensitive =
        /secret|password|passwd|token|api[_-]?key|private|credential|auth/i.test(lower);
      if (!sensitive) return line;
      return `${key}=••••••••`;
    })
    .join("\n");
}
