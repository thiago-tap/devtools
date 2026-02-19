import type { JWTPayload } from "@/types";

export function decodeJWT(token: string): { result?: JWTPayload; error?: string } {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return { error: "Token JWT inválido: deve ter 3 partes separadas por ponto." };
    }

    const decode = (str: string) => {
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      return JSON.parse(atob(padded));
    };

    const header = decode(parts[0]);
    const payload = decode(parts[1]);

    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? payload.exp < now : false;
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;

    return {
      result: {
        header,
        payload,
        signature: parts[2],
        isExpired,
        expiresAt,
      },
    };
  } catch (e) {
    return { error: "Erro ao decodificar: " + (e as Error).message };
  }
}

export function formatJWTClaim(key: string, value: unknown): string {
  const claims: Record<string, string> = {
    sub: "Subject (usuário)",
    iss: "Issuer (emissor)",
    aud: "Audience (audiência)",
    exp: "Expires At (expira em)",
    iat: "Issued At (emitido em)",
    nbf: "Not Before (válido a partir de)",
    jti: "JWT ID",
  };

  if ((key === "exp" || key === "iat" || key === "nbf") && typeof value === "number") {
    return new Date(value * 1000).toLocaleString("pt-BR");
  }

  return claims[key] ? `${claims[key]}` : key;
}
