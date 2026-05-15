import { type NextRequest, NextResponse } from "next/server";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Limite simples por IP (válido por isolate do Worker). */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: `Muitas requisições. Tente novamente em ${retryAfterSec}s.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");

  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "metadata.google.internal"
  ) {
    return true;
  }

  // IPv4 literal
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    const c = Number(ipv4[3]);
    const d = Number(ipv4[4]);
    if (a === 127 || a === 0 || a >= 224) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (d === 255 && c === 255) return true;
  }

  if (h.includes(":")) {
    if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) {
      return true;
    }
  }

  return false;
}

export function isBlockedUrl(urlStr: string): boolean {
  try {
    const { hostname, protocol } = new URL(urlStr);
    if (protocol !== "http:" && protocol !== "https:") return true;
    return isBlockedHostname(hostname);
  } catch {
    return true;
  }
}

export function validatePublicDomain(domain: string): { ok: true; clean: string } | { ok: false; error: string } {
  let clean = domain.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");

  if (!clean || clean.length > 253) {
    return { ok: false, error: "Domínio inválido" };
  }

  if (clean.includes(":") || clean.includes("/") || clean.includes(" ")) {
    return { ok: false, error: "Domínio inválido" };
  }

  if (isBlockedHostname(clean)) {
    return { ok: false, error: "Domínio não permitido (endereço privado ou reservado)" };
  }

  // Bloqueia IPs literais em consultas DNS
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean) || clean.includes(":")) {
    return { ok: false, error: "Use um nome de domínio, não um endereço IP" };
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(clean)) {
    return { ok: false, error: "Formato de domínio inválido" };
  }

  return { ok: true, clean };
}

export async function parseJsonBody<T>(
  request: NextRequest,
  maxBytes = 100_000
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Payload muito grande" }, { status: 413 }),
    };
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Payload muito grande" }, { status: 413 }),
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "JSON inválido" }, { status: 400 }),
    };
  }
}

export function withApiGuards(
  request: NextRequest,
  opts?: { limit?: number; windowMs?: number }
): NextResponse | null {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`api:${ip}`, opts?.limit ?? 60, opts?.windowMs ?? 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  return null;
}
