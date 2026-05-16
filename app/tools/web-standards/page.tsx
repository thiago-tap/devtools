"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { generateRobotsTxt, generateSecurityTxt, generateSitemapXml, recommendedSecurityHeaders } from "@/lib/tools/web-standards";

export default function WebStandardsPage() {
  const [origin, setOrigin] = useState("https://example.com");
  const [urls, setUrls] = useState("https://example.com/\nhttps://example.com/blog");
  const [contact, setContact] = useState("mailto:security@example.com");
  const [expires] = useState(() => new Date(Date.now() + 90 * 86_400_000).toISOString());
  const robots = useMemo(() => generateRobotsTxt(origin), [origin]);
  const sitemap = useMemo(() => generateSitemapXml(urls.split(/\r?\n/).filter(Boolean)), [urls]);
  const security = useMemo(() => generateSecurityTxt(contact, expires), [contact, expires]);
  const securityHeaders = recommendedSecurityHeaders();

  return (
    <ToolLayout title="Web Standards Generator" description="Gere robots.txt, sitemap.xml, security.txt e headers recomendados.">
      <Panel title="Entradas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <Textarea value={urls} onChange={(e) => setUrls(e.target.value)} className="min-h-[100px] mt-3 font-mono text-xs" />
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="robots.txt" actions={<CopyButton text={robots} />}><pre className="text-xs whitespace-pre-wrap">{robots}</pre></Panel>
        <Panel title="sitemap.xml" actions={<CopyButton text={sitemap} />}><pre className="text-xs whitespace-pre-wrap">{sitemap}</pre></Panel>
        <Panel title="security.txt" actions={<CopyButton text={security} />}><pre className="text-xs whitespace-pre-wrap">{security}</pre></Panel>
        <Panel title="Headers" actions={<CopyButton text={securityHeaders} />}><pre className="text-xs whitespace-pre-wrap">{securityHeaders}</pre></Panel>
      </div>
    </ToolLayout>
  );
}
