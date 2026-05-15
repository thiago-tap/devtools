export type SecretEncoding = "base64" | "hex";

export interface SecretPreset {
  id: string;
  name: string;
  description: string;
  bytes: number;
  encoding: SecretEncoding;
  opensslCommand: string;
}

export const SECRET_PRESETS: SecretPreset[] = [
  {
    id: "jwt-base64",
    name: "JWT / cron / webhooks",
    description: "Secret típico para assinatura JWT, jobs agendados e webhooks",
    bytes: 32,
    encoding: "base64",
    opensslCommand: "openssl rand -base64 32",
  },
  {
    id: "cache-hex",
    name: "Purge de cache",
    description: "Token em hexadecimal (ex.: purge keys)",
    bytes: 32,
    encoding: "hex",
    opensslCommand: "openssl rand -hex 32",
  },
  {
    id: "session-base64",
    name: "SESSION_SECRET",
    description: "Chave de sessão em apps Node/Next",
    bytes: 48,
    encoding: "base64",
    opensslCommand: "openssl rand -base64 48",
  },
  {
    id: "api-hex",
    name: "API key (hex)",
    description: "64 caracteres hex = 32 bytes",
    bytes: 32,
    encoding: "hex",
    opensslCommand: "openssl rand -hex 32",
  },
];

/** Equivalente a `openssl rand -base64 N` / `openssl rand -hex N` (N = bytes). */
export function generateSecret(bytes: number, encoding: SecretEncoding): string {
  const size = Math.min(Math.max(Math.floor(bytes), 8), 256);
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);

  if (encoding === "hex") {
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]!);
  }
  return btoa(binary);
}

export function generateSecrets(
  count: number,
  bytes: number,
  encoding: SecretEncoding
): string[] {
  const n = Math.min(Math.max(count, 1), 20);
  return Array.from({ length: n }, () => generateSecret(bytes, encoding));
}
