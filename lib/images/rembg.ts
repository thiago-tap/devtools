/**
 * Cliente para servidor HTTP Rembg (danielgatis/rembg).
 * @see https://github.com/danielgatis/rembg — `rembg s` expõe POST /api/remove com multipart field "file"
 */

export function getRembgBaseUrl(): string | null {
  const raw = process.env.REMBG_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function isRembgConfigured(): boolean {
  return getRembgBaseUrl() !== null;
}

const DEFAULT_TIMEOUT_MS = Number(process.env.REMBG_TIMEOUT_MS ?? "180000");

export async function removeBackgroundViaRembg(
  buffer: Buffer,
  fileName: string,
  mime: string,
  opts?: { timeoutMs?: number }
): Promise<Buffer> {
  const base = getRembgBaseUrl();
  if (!base) {
    throw new Error("Remoção de fundo não está configurada no servidor (REMBG_BASE_URL).");
  }

  let target: URL;
  try {
    target = new URL(`${base}/api/remove`);
  } catch {
    throw new Error("REMBG_BASE_URL inválida.");
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("REMBG_BASE_URL deve ser http ou https.");
  }

  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime || "application/octet-stream" }), fileName || "image.png");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(target, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Rembg respondeu ${res.status}: ${detail.slice(0, 280)}`);
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Rembg excedeu o tempo (${Math.round(timeoutMs / 1000)}s). Tente uma imagem menor.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function isRembgHeavyAction(action: string): boolean {
  switch (action) {
    case "remove_bg":
    case "preset_dtf_transparent":
    case "preset_camisa_preta_transparent":
      return true;
    default:
      return false;
  }
}
