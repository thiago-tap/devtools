import { type NextRequest, NextResponse } from "next/server";
import {
  isBlockedUrl,
  parseJsonBody,
  withApiGuards,
} from "@/lib/api/security";

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;

  const body = await parseJsonBody<{ url?: string }>(request);
  if (!body.ok) return body.response;

  try {
    const { url: inputUrl } = body.data;

    if (!inputUrl || typeof inputUrl !== "string") {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    let url = inputUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    if (isBlockedUrl(url)) {
      return NextResponse.json(
        { error: "URL não permitida (endereço privado ou interno)" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        const nextUrl = new URL(location, url).href;
        if (isBlockedUrl(nextUrl)) {
          return NextResponse.json({ error: "Redirecionamento para URL não permitida" }, { status: 400 });
        }
      }

      return NextResponse.json({
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        redirectLocation: location,
        headers,
        redirected: response.redirected,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      if ((fetchError as Error).name === "AbortError") {
        return NextResponse.json(
          { error: "Timeout: a requisição demorou mais de 10 segundos" },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (e) {
    console.error("headers lookup failed", e);
    return NextResponse.json(
      { error: "Erro ao buscar headers da URL" },
      { status: 500 }
    );
  }
}
