import { type NextRequest, NextResponse } from "next/server";
import {
  parseJsonBody,
  validatePublicDomain,
  withApiGuards,
} from "@/lib/api/security";

const DNS_TYPE_NAMES: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};

const RCODE_MESSAGES: Record<number, string> = {
  1: "FORMERR - Formato da requisição inválido",
  2: "SERVFAIL - Falha no servidor DNS",
  3: "NXDOMAIN - Domínio não encontrado",
  4: "NOTIMP - Não implementado",
  5: "REFUSED - Requisição recusada",
};

const ALLOWED_TYPES = new Set(["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "SRV", "CAA"]);

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;

  const body = await parseJsonBody<{ domain?: string; type?: string }>(request);
  if (!body.ok) return body.response;

  try {
    const { domain, type } = body.data;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domínio inválido" }, { status: 400 });
    }

    const validated = validatePublicDomain(domain);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const queryType = (type || "A").toUpperCase();
    if (!ALLOWED_TYPES.has(queryType)) {
      return NextResponse.json({ error: "Tipo DNS não suportado" }, { status: 400 });
    }

    const url = new URL("https://cloudflare-dns.com/dns-query");
    url.searchParams.set("name", validated.clean);
    url.searchParams.set("type", queryType);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/dns-json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao consultar DNS: ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      Status: number;
      Answer?: { name: string; type: number; TTL: number; data: string }[];
    };

    if (data.Status !== 0) {
      const msg = RCODE_MESSAGES[data.Status] ?? `Erro DNS (código ${data.Status})`;
      return NextResponse.json({ error: msg, status: data.Status });
    }

    const records = (data.Answer ?? []).map((r) => ({
      name: r.name,
      type: DNS_TYPE_NAMES[r.type] ?? `TYPE${r.type}`,
      ttl: r.TTL,
      value: r.data,
    }));

    return NextResponse.json({
      records,
      domain: validated.clean,
      queryType,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro interno: " + (e as Error).message },
      { status: 500 }
    );
  }
}
