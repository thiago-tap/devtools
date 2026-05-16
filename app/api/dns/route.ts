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

const QUERY_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "SRV", "CAA"] as const;
const ALLOWED_TYPES = new Set([...QUERY_TYPES, "ALL"]);

type DnsRecord = {
  name: string;
  type: string;
  ttl: number;
  value: string;
};

type DnsJsonResponse = {
  Status: number;
  Answer?: { name: string; type: number; TTL: number; data: string }[];
};

type DnsQueryResult = { status: number; records: DnsRecord[] };
type DnsAllResult = DnsQueryResult & { dnsType: (typeof QUERY_TYPES)[number] };

function toRecords(data: DnsJsonResponse): DnsRecord[] {
  return (data.Answer ?? []).map((r) => ({
    name: r.name,
    type: DNS_TYPE_NAMES[r.type] ?? `TYPE${r.type}`,
    ttl: r.TTL,
    value: r.data,
  }));
}

async function queryDns(domain: string, queryType: string): Promise<DnsQueryResult> {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", domain);
  url.searchParams.set("type", queryType);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Erro ao consultar DNS: ${response.status}`);
  }

  const data = (await response.json()) as DnsJsonResponse;
  return { status: data.Status, records: toRecords(data) };
}

function isFulfilledDnsResult(
  item: PromiseSettledResult<DnsAllResult>,
): item is PromiseFulfilledResult<DnsAllResult> {
  return item.status === "fulfilled";
}

async function queryAllDns(domain: string): Promise<DnsQueryResult[]> {
  const settled = await Promise.allSettled(
    QUERY_TYPES.map(async (dnsType) => ({
      dnsType,
      ...(await queryDns(domain, dnsType)),
    })),
  );

  return settled
    .filter(isFulfilledDnsResult)
    .map((item) => item.value);
}

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

    if (queryType === "ALL") {
      const results = await queryAllDns(validated.clean);

      const records = results
        .filter((r) => r.status === 0)
        .flatMap((r) => r.records)
        .sort((a, b) => a.type.localeCompare(b.type) || a.value.localeCompare(b.value));

      if (results.length === 0) {
        return NextResponse.json({ error: "Erro ao consultar DNS" }, { status: 502 });
      }

      if (records.length === 0 && results.every((r) => r.status !== 0)) {
        const firstStatus = results[0]?.status ?? 2;
        const msg = RCODE_MESSAGES[firstStatus] ?? `Erro DNS (código ${firstStatus})`;
        return NextResponse.json({ error: msg, status: firstStatus });
      }

      return NextResponse.json({
        records,
        domain: validated.clean,
        queryType,
      });
    }

    const data = await queryDns(validated.clean, queryType);

    if (data.status !== 0) {
      const msg = RCODE_MESSAGES[data.status] ?? `Erro DNS (código ${data.status})`;
      return NextResponse.json({ error: msg, status: data.status });
    }

    return NextResponse.json({
      records: data.records,
      domain: validated.clean,
      queryType,
    });
  } catch (e) {
    console.error("[dns] query error", e);
    return NextResponse.json({ error: "Erro ao consultar DNS" }, { status: 502 });
  }
}
