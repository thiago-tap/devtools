import { type NextRequest, NextResponse } from "next/server";
import {
  isBlockedUrl,
  parseJsonBody,
  withApiGuards,
} from "@/lib/api/security";

const MAX_BYTES = 350_000;

function extractMeta(html: string): Record<string, string | undefined> {
  const pick = (re: RegExp) => html.match(re)?.[1]?.trim();

  const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogTitle2 = pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  const ogDesc = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc2 = pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const twTitle = pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
  const titleTag = pick(/<title[^>]*>([^<]{1,500})<\/title>/i);

  return {
    title: ogTitle ?? ogTitle2 ?? twTitle ?? titleTag,
    description: ogDesc ?? ogDesc2,
    image: ogImage,
  };
}

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;

  const body = await parseJsonBody<{ url?: string }>(request);
  if (!body.ok) return body.response;

  let url = body.data.url?.trim() ?? "";
  if (!url) return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
  if (isBlockedUrl(url)) {
    return NextResponse.json({ error: "URL não permitida" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "DevToolbox/1.0 (+https://devtools.catiteo.com)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { error: `HTTP ${res.status} ${res.statusText}`, finalUrl: res.url },
        { status: 502 }
      );
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "Sem corpo de resposta" }, { status: 502 });
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
      const joined = Buffer.concat(chunks.map((c) => Buffer.from(c)));
      const head = joined.toString("utf8", 0, Math.min(joined.length, MAX_BYTES));
      if (/<\/head>/i.test(head) || /<body[\s>]/i.test(head)) {
        break;
      }
    }
    await reader.cancel().catch(() => {});

    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const html = buf.toString("utf8", 0, Math.min(buf.length, MAX_BYTES));
    const meta = extractMeta(html);

    return NextResponse.json({
      finalUrl: res.url,
      status: res.status,
      meta,
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === "AbortError") {
      return NextResponse.json({ error: "Timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
