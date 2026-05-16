import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";

function b64urlToBytes(part: string): Uint8Array {
  const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(part.length + ((4 - (part.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToB64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function verifyJwtHS256(token: string, secret: string): { ok: boolean; error?: string } {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { ok: false, error: "JWT deve ter 3 partes." };
  const encoder = new TextEncoder();
  const data = encoder.encode(`${parts[0]}.${parts[1]}`);
  const sig = bytesToB64url(hmac(sha256, encoder.encode(secret), data));
  return sig === parts[2] ? { ok: true } : { ok: false, error: "Assinatura HS256 inválida." };
}

export async function verifyJwtRs256WithJwk(token: string, jwk: JsonWebKey): Promise<{ ok: boolean; error?: string }> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { ok: false, error: "JWT deve ter 3 partes." };
  try {
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      toArrayBuffer(b64urlToBytes(parts[2])),
      toArrayBuffer(new TextEncoder().encode(`${parts[0]}.${parts[1]}`)),
    );
    return ok ? { ok: true } : { ok: false, error: "Assinatura RS256 inválida." };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
