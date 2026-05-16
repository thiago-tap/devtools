export interface ParsedCurl {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body: string;
}

function tokenize(command: string): string[] {
  const matches = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  return matches.map((part) => part.replace(/^["']|["']$/g, ""));
}

export function parseCurl(command: string): { result?: ParsedCurl; error?: string } {
  const tokens = tokenize(command.replace(/\\\r?\n/g, " "));
  if (tokens[0] !== "curl") return { error: "Comando deve começar com curl." };

  const result: ParsedCurl = { method: "GET", url: "", headers: [], body: "" };
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const next = tokens[i + 1] ?? "";
    if (token === "-X" || token === "--request") {
      result.method = next.toUpperCase();
      i++;
    } else if (token === "-H" || token === "--header") {
      const [key, ...rest] = next.split(":");
      if (key && rest.length) result.headers.push({ key: key.trim(), value: rest.join(":").trim() });
      i++;
    } else if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary") {
      result.body = next;
      if (result.method === "GET") result.method = "POST";
      i++;
    } else if (!token.startsWith("-") && !result.url) {
      result.url = token;
    }
  }

  if (!result.url) return { error: "URL não encontrada no comando curl." };
  return { result };
}

export function toFetchSnippet(request: ParsedCurl): string {
  const headers = Object.fromEntries(request.headers.map((header) => [header.key, header.value]));
  return `await fetch(${JSON.stringify(request.url)}, ${JSON.stringify({
    method: request.method,
    headers,
    body: request.body || undefined,
  }, null, 2)});`;
}

export function toHttpieSnippet(request: ParsedCurl): string {
  const headers = request.headers.map((header) => `${header.key}:${header.value}`).join(" ");
  return `http ${request.method} ${request.url}${headers ? ` ${headers}` : ""}${request.body ? ` <<< '${request.body}'` : ""}`;
}
