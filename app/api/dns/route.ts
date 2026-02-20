import { type NextRequest, NextResponse } from "next/server";

const DNS_TYPE_NAMES: Record<number, string> = {
  1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX",
  16: "TXT", 28: "AAAA", 33: "SRV", 257: "CAA",
};

const RCODE_MESSAGES: Record<number, string> = {
  1: "FORMERR - Formato da requisição inválido",
  2: "SERVFAIL - Falha no servidor DNS",
  3: "NXDOMAIN - Domínio não encontrado",
  4: "NOTIMP - Não implementado",
  5: "REFUSED - Requisição recusada",
};

export async function POST(request: NextRequest) {
  try {
    const { domain, type } = await request.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domínio inválido" }, { status: 400 });
    }

    const cleanDomain = domain.trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");

    const url = new URL("https://cloudflare-dns.com/dns-query");
    url.searchParams.set("name", cleanDomain);
    url.searchParams.set("type", type || "A");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/dns-json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao consultar DNS: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json() as {
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

    return NextResponse.json({ records, domain: cleanDomain, queryType: type || "A" });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro interno: " + (e as Error).message },
      { status: 500 }
    );
  }
}
