import { type NextRequest, NextResponse } from "next/server";
import { isBlockedHostname, parseJsonBody, withApiGuards } from "@/lib/api/security";

interface JwksBody {
  url?: string;
}

type PublicJwk = JsonWebKey & { kid?: string };

const ALLOWED_JWK_FIELDS = ["kty", "use", "alg", "kid", "n", "e", "x", "y", "crv", "k"] as const;

function filterPublicJwk(key: PublicJwk): Partial<PublicJwk> {
  return Object.fromEntries(
    ALLOWED_JWK_FIELDS
      .filter((field) => key[field] !== undefined)
      .map((field) => [field, key[field]]),
  ) as Partial<PublicJwk>;
}

function isValidHttpsJwksUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" && !isBlockedHostname(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;

  const body = await parseJsonBody<JwksBody>(request);
  if (!body.ok) return body.response;

  const url = body.data.url?.trim() ?? "";
  if (!url || !isValidHttpsJwksUrl(url)) {
    return NextResponse.json({ error: "URL JWKS inválida ou não permitida" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      headers: { Accept: "application/json", "User-Agent": "DevToolbox/1.0 (+https://devtools.catiteo.com)" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `JWKS respondeu HTTP ${response.status}` }, { status: 502 });
    }

    const text = (await response.text()).slice(0, 200_000);
    const jwks = JSON.parse(text) as { keys?: PublicJwk[] };
    if (!Array.isArray(jwks.keys)) {
      return NextResponse.json({ error: "Resposta JWKS sem array keys" }, { status: 422 });
    }

    return NextResponse.json({ keys: jwks.keys.map(filterPublicJwk) });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar JWKS público" }, { status: 502 });
  }
}
