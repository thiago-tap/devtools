import { isBlockedUrl } from "@/lib/api/security";

export const DEFAULT_USER_AGENT = "DevToolbox/1.0 (+https://devtools.catiteo.com)";

export function normalizeHttpUrl(input: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "URL obrigatória" };
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (isBlockedUrl(url)) return { ok: false, error: "URL não permitida" };
  return { ok: true, url };
}

export async function readTextLimited(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});

  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  return buffer.toString("utf8", 0, Math.min(buffer.length, maxBytes));
}
