import { type NextRequest, NextResponse } from "next/server";
import {
  isBlockedUrl,
  parseJsonBody,
  withApiGuards,
} from "@/lib/api/security";

const MAX_HOPS = 20;

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;

  const body = await parseJsonBody<{ url?: string }>(request);
  if (!body.ok) return body.response;

  const inputUrl = body.data.url?.trim();
  if (!inputUrl) {
    return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });
  }

  let url = inputUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  if (isBlockedUrl(url)) {
    return NextResponse.json({ error: "URL não permitida" }, { status: 400 });
  }

  const hops: { url: string; status: number; location?: string }[] = [];
  let current = url;

  for (let i = 0; i < MAX_HOPS; i++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "DevToolbox/1.0 (+https://devtools.catiteo.com)" },
      });
      clearTimeout(t);
      const loc = res.headers.get("location") ?? undefined;
      hops.push({ url: current, status: res.status, location: loc });

      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, current).href;
        if (isBlockedUrl(next)) {
          return NextResponse.json(
            { error: "Redirecionamento para URL não permitida", hops },
            { status: 400 }
          );
        }
        current = next;
        continue;
      }
      return NextResponse.json({ hops, finalUrl: current, finalStatus: res.status });
    } catch (e) {
      clearTimeout(t);
      const name = (e as Error).name;
      if (name === "AbortError") {
        return NextResponse.json(
          { error: "Timeout ao seguir redirecionamentos", hops },
          { status: 504 }
        );
      }
      console.error("redirect chain failed", e);
      return NextResponse.json(
        { error: "Erro de rede ao seguir redirecionamentos", hops },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: "Demasiados redirecionamentos", hops }, { status: 400 });
}
