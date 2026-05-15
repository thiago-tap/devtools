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
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return NextResponse.json({
        status: response.status,
        statusText: response.statusText,
        url: response.url,
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
    return NextResponse.json(
      { error: "Erro ao buscar URL: " + (e as Error).message },
      { status: 500 }
    );
  }
}
