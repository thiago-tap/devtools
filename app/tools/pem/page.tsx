"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";

type CertInfo = {
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  serialNumber: string;
};

function splitPemBlocks(text: string): string[] {
  const re = /-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g;
  return text.match(re) ?? [];
}

export default function PemPage() {
  const [pem, setPem] = useState("");
  const [certs, setCerts] = useState<CertInfo[]>([]);
  const [parseError, setParseError] = useState("");

  const blocks = useMemo(() => splitPemBlocks(pem), [pem]);

  useEffect(() => {
    let cancelled = false;
    setParseError("");
    setCerts([]);

    if (!pem.trim()) return;

    void (async () => {
      try {
        await import("reflect-metadata");
        const { X509Certificate } = await import("@peculiar/x509");
        const infos: CertInfo[] = [];
        for (const block of blocks) {
          if (!block.includes("BEGIN CERTIFICATE")) continue;
          try {
            const cert = new X509Certificate(block);
            infos.push({
              subject: cert.subject,
              issuer: cert.issuer,
              notBefore: cert.notBefore.toISOString(),
              notAfter: cert.notAfter.toISOString(),
              serialNumber: cert.serialNumber,
            });
          } catch {
            /* skip malformed block */
          }
        }
        if (!cancelled) {
          setCerts(infos);
          if (blocks.some((b) => b.includes("BEGIN CERTIFICATE")) && infos.length === 0) {
            setParseError("Não foi possível interpretar o(s) certificado(s). Verifique o PEM.");
          }
        }
      } catch (e) {
        if (!cancelled) setParseError((e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pem, blocks]);

  return (
    <ToolLayout
      title="PEM / X.509"
      description="Cole PEM de certificado para ver subject, emissor e validade (browser, @peculiar/x509)."
    >
      <p className="text-sm text-muted-foreground">
        Chaves privadas não são analisadas. Apenas blocos <code className="text-xs">CERTIFICATE</code> são
        decodificados.
      </p>
      <Panel title="PEM">
        <Textarea
          value={pem}
          onChange={(e) => setPem(e.target.value)}
          placeholder="-----BEGIN CERTIFICATE-----..."
          className="min-h-[180px] font-mono text-xs"
        />
      </Panel>

      <Panel title="Blocos detetados">
        <p className="text-sm">{blocks.length ? `${blocks.length} bloco(s)` : "Nenhum bloco PEM completo."}</p>
        {parseError && <p className="text-sm text-destructive mt-2">{parseError}</p>}
      </Panel>

      {certs.length > 0 && (
        <Panel title="Certificados">
          <ul className="space-y-4 text-sm">
            {certs.map((c, i) => (
              <li key={i} className="rounded-md border p-3 space-y-1 font-mono text-xs">
                <p>
                  <span className="text-muted-foreground">Subject:</span> {c.subject}
                </p>
                <p>
                  <span className="text-muted-foreground">Issuer:</span> {c.issuer}
                </p>
                <p>
                  <span className="text-muted-foreground">Válido:</span> {c.notBefore} → {c.notAfter}
                </p>
                <p>
                  <span className="text-muted-foreground">Serial:</span> {c.serialNumber}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </ToolLayout>
  );
}
