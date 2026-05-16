export interface ParsedLogLine {
  raw: string;
  json?: Record<string, unknown>;
  level?: string;
  timestamp?: string;
}

export function parseLogLines(input: string): ParsedLogLine[] {
  return input
    .split(/\r?\n/)
    .filter(Boolean)
    .map((raw) => {
      try {
        const json = JSON.parse(raw) as Record<string, unknown>;
        return {
          raw,
          json,
          level: String(json.level ?? json.severity ?? json.status ?? ""),
          timestamp: String(json.time ?? json.timestamp ?? json.ts ?? ""),
        };
      } catch {
        return {
          raw,
          level: raw.match(/\b(error|warn|info|debug|fatal)\b/i)?.[1]?.toLowerCase(),
          timestamp: raw.match(/\d{4}-\d{2}-\d{2}[T\s][^\s]+/)?.[0],
        };
      }
    });
}

export function formatLogLines(lines: ParsedLogLine[], query = ""): string {
  const q = query.toLowerCase();
  return lines
    .filter((line) => !q || line.raw.toLowerCase().includes(q))
    .map((line) => (line.json ? JSON.stringify(line.json, null, 2) : line.raw))
    .join("\n");
}
