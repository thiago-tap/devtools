import { type NextRequest, NextResponse } from "next/server";
import { isBlockedUrl, parseJsonBody, withApiGuards } from "@/lib/api/security";

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;
  const body = await parseJsonBody<{ url?: string }>(request);
  if (!body.ok) return body.response;

  let url = body.data.url?.trim() ?? "";
  if (!url) return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (isBlockedUrl(url)) return NextResponse.json({ error: "URL não permitida" }, { status: 400 });

  const started = performance.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "DevToolbox/1.0 (+https://devtools.catiteo.com)" },
    });
    const latencyMs = Math.round(performance.now() - started);
    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      finalUrl: res.url,
      latencyMs,
      contentType: res.headers.get("content-type"),
      cacheControl: res.headers.get("cache-control"),
      server: res.headers.get("server"),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao consultar URL" }, { status: 502 });
  }
}
