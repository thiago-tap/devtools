import { type NextRequest, NextResponse } from "next/server";
import { isBlockedUrl, parseJsonBody, withApiGuards } from "@/lib/api/security";

async function fetchText(url: string) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "DevToolbox/1.0 (+https://devtools.catiteo.com)" },
  });
  const text = res.ok ? await res.text() : "";
  return { ok: res.ok, status: res.status, text: text.slice(0, 200_000) };
}

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;
  const body = await parseJsonBody<{ url?: string }>(request);
  if (!body.ok) return body.response;

  let base = body.data.url?.trim() ?? "";
  if (!base) return NextResponse.json({ error: "URL/domínio obrigatório" }, { status: 400 });
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  if (isBlockedUrl(base)) return NextResponse.json({ error: "URL não permitida" }, { status: 400 });

  const origin = new URL(base).origin;
  try {
    const [robots, sitemap] = await Promise.all([
      fetchText(`${origin}/robots.txt`),
      fetchText(`${origin}/sitemap.xml`),
    ]);
    const sitemapUrls = Array.from(sitemap.text.matchAll(/<loc>(.*?)<\/loc>/gi)).map((m) => m[1]).slice(0, 100);
    return NextResponse.json({
      origin,
      robots: {
        ...robots,
        hasSitemapDirective: /sitemap:/i.test(robots.text),
        disallowCount: (robots.text.match(/^\s*disallow:/gim) ?? []).length,
      },
      sitemap: {
        ok: sitemap.ok,
        status: sitemap.status,
        urlCount: sitemapUrls.length,
        urls: sitemapUrls,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao validar robots/sitemap" }, { status: 502 });
  }
}
