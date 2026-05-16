import { type NextRequest, NextResponse } from "next/server";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);
const BLOCKED_HOSTNAME_SUFFIXES = [".localhost", ".local", ".internal"];

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

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function isBlockedIpv4Literal(hostname: string): boolean {
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!ipv4) return false;

  const [, aPart, bPart, cPart, dPart] = ipv4;
  const a = Number(aPart);
  const b = Number(bPart);
  const c = Number(cPart);
  const d = Number(dPart);

  if (a === 127 || a === 0 || a >= 224) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (d === 255 && c === 255) return true;

  return false;
}

function isBlockedIpv6Literal(hostname: string): boolean {
  if (!hostname.includes(":")) return false;

  const firstSegment = Number.parseInt(hostname.split(":")[0] ?? "", 16);
  const isLinkLocal = Number.isFinite(firstSegment) && (firstSegment & 0xffc0) === 0xfe80;
  const isUniqueLocal = Number.isFinite(firstSegment) && (firstSegment & 0xfe00) === 0xfc00;

  return (
    hostname === "::" ||
    hostname === "::1" ||
    hostname.startsWith("::ffff:") ||
    isLinkLocal ||
    isUniqueLocal
  );
}

export function isBlockedHostname(hostname: string): boolean {
  const h = normalizeHostname(hostname);

  if (
    BLOCKED_HOSTNAMES.has(h) ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => h.endsWith(suffix))
  ) {
    return true;
  }

  return isBlockedIpv4Literal(h) || isBlockedIpv6Literal(h);
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
