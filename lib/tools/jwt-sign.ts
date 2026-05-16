import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";

function b64url(data: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < data.length; i++) bin += String.fromCharCode(data[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * JWT HS256 (apenas para testes locais — o segredo trafega no browser se usado na UI).
 */
export function signJwtHS256(
  payload: Record<string, unknown>,
  secret: string,
  headerExtra?: Record<string, unknown>
): string {
  const header = { alg: "HS256", typ: "JWT", ...headerExtra };
  const h = b64url(utf8(JSON.stringify(header)));
  const p = b64url(utf8(JSON.stringify(payload)));
  const data = utf8(`${h}.${p}`);
  const key = utf8(secret);
  const sig = hmac(sha256, key, data);
  const s = b64url(sig);
  return `${h}.${p}.${s}`;
}
