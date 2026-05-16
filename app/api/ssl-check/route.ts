import tls from "node:tls";
import { type NextRequest, NextResponse } from "next/server";
import { parseJsonBody, validatePublicDomain, withApiGuards } from "@/lib/api/security";

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;
  const body = await parseJsonBody<{ host?: string }>(request);
  if (!body.ok) return body.response;

  const input = body.data.host?.trim().replace(/^https?:\/\//i, "").split("/")[0] ?? "";
  const validated = validatePublicDomain(input);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  const result = await new Promise<Record<string, unknown>>((resolve) => {
    const socket = tls.connect(
      { host: validated.clean, port: 443, servername: validated.clean, timeout: 10_000 },
      () => {
        const cert = socket.getPeerCertificate();
        resolve({
          host: validated.clean,
          authorized: socket.authorized,
          authorizationError: socket.authorizationError,
          protocol: socket.getProtocol(),
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          fingerprint256: cert.fingerprint256,
        });
        socket.end();
      },
    );
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ error: "Timeout ao conectar TLS" });
    });
    socket.on("error", () => resolve({ error: "Erro ao conectar TLS" }));
  });

  return NextResponse.json(result, "error" in result ? { status: 502 } : undefined);
}
