import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_AGENT, normalizeHttpUrl, readTextLimited } from "@/lib/api/network";
import { parseJsonBody, withApiGuards } from "@/lib/api/security";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const BLOCKED_REQUEST_HEADERS = new Set(["host", "connection", "content-length", "transfer-encoding"]);

interface RestClientBody {
  method?: string;
  url?: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
}

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request, { limit: 45, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await parseJsonBody<RestClientBody>(request, 200_000);
  if (!body.ok) return body.response;

  const method = (body.data.method ?? "GET").toUpperCase();
  if (!ALLOWED_METHODS.has(method)) return NextResponse.json({ error: "Método HTTP não permitido" }, { status: 400 });

  const normalized = normalizeHttpUrl(body.data.url ?? "");
  if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });

  const headers = new Headers();
  headers.set("User-Agent", DEFAULT_USER_AGENT);
  for (const header of body.data.headers ?? []) {
    if (header.key && !BLOCKED_REQUEST_HEADERS.has(header.key.toLowerCase())) {
      headers.set(header.key, header.value);
    }
  }

  const started = performance.now();
  try {
    const response = await fetch(normalized.url, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : body.data.body,
    });
    const text = method === "HEAD" ? "" : await readTextLimited(response, 500_000);
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      finalUrl: response.url,
      latencyMs: Math.round(performance.now() - started),
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
      truncated: text.length >= 500_000,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao executar request" }, { status: 502 });
  }
}
