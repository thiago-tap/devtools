import { type NextRequest, NextResponse } from "next/server";
import {
  isBlockedUrl,
  parseJsonBody,
  withApiGuards,
} from "@/lib/api/security";

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;

  const body = await parseJsonBody<{ url?: string; origin?: string }>(request);
  if (!body.ok) return body.response;

  let url = body.data.url?.trim() ?? "";
  const origin = (body.data.origin ?? "*").trim() || "*";
  if (!url) return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
  if (isBlockedUrl(url)) {
    return NextResponse.json({ error: "URL não permitida" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Origin: origin,
        "User-Agent": "DevToolbox/1.0 (+https://devtools.catiteo.com)",
        "Access-Control-Request-Method": "GET",
      },
    });
    clearTimeout(timer);

    const acao = res.headers.get("access-control-allow-origin");
    const acam = res.headers.get("access-control-allow-methods");
    const acac = res.headers.get("access-control-allow-credentials");
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const nextUrl = new URL(location, url).href;
      if (isBlockedUrl(nextUrl)) {
        return NextResponse.json({ error: "Redirecionamento para URL não permitida" }, { status: 400 });
      }
    }

    return NextResponse.json({
      finalUrl: res.url,
      status: res.status,
      redirectLocation: location,
      requestOrigin: origin,
      accessControlAllowOrigin: acao,
      accessControlAllowMethods: acam,
      accessControlAllowCredentials: acac,
      note:
        "Muitos servidores não respondem a HEAD com CORS; use como indício. Navegadores aplicam regras adicionais.",
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === "AbortError") {
      return NextResponse.json({ error: "Timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Erro ao consultar CORS da URL" }, { status: 502 });
  }
}
