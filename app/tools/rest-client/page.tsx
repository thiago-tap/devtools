"use client";

import { useEffect, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { emptyWorkspace, isRestWorkspace, loadWorkspace, saveWorkspace, upsertRequest, type RestWorkspace } from "@/lib/storage/workspaces";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export default function RestClientPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://example.com");
  const [headersText, setHeadersText] = useState("Accept: application/json");
  const [body, setBody] = useState("");
  const [collection, setCollection] = useState("Default");
  const [workspace, setWorkspace] = useState<RestWorkspace>(emptyWorkspace);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState("");

  useEffect(() => setWorkspace(loadWorkspace()), []);

  const headers = headersText
    .split(/\r?\n/)
    .map((line) => {
      const [key, ...rest] = line.split(":");
      return { key: key?.trim() ?? "", value: rest.join(":").trim() };
    })
    .filter((header) => header.key);

  async function send() {
    setLoading(true);
    try {
      const response = await fetch("/api/rest-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, url, headers, body }),
      });
      setResult(await response.json());
    } catch (e) {
      setResult({ error: (e as Error).message || "Erro ao executar request" });
    } finally {
      setLoading(false);
    }
  }

  function saveRequest() {
    const next = upsertRequest(workspace, collection || "Default", {
      name: `${method} ${url}`,
      method,
      url,
      headers,
      body,
    });
    saveWorkspace(next);
    setWorkspace(next);
  }

  function importWorkspace(text: string) {
    try {
      const next = JSON.parse(text) as unknown;
      if (!isRestWorkspace(next)) throw new Error("Workspace inválido");
      saveWorkspace(next);
      setWorkspace(next);
      setImportError("");
    } catch {
      setImportError("Não foi possível importar: JSON inválido ou formato não reconhecido.");
    }
  }

  return (
    <ToolLayout title="REST Client" description="Execute requests HTTP, salve coleções locais e exporte seu workspace.">
      <Panel title="Request">
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2">
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
        </div>
        <label className="text-xs text-muted-foreground mt-3 block">Headers (um por linha)</label>
        <Textarea value={headersText} onChange={(e) => setHeadersText(e.target.value)} className="min-h-[90px] font-mono text-xs" />
        <label className="text-xs text-muted-foreground mt-3 block">Body</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[120px] font-mono text-xs" />
        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={() => void send()} disabled={loading || !url.trim()}>{loading ? "Enviando..." : "Enviar"}</Button>
          <Input value={collection} onChange={(e) => setCollection(e.target.value)} className="max-w-48" />
          <Button variant="outline" onClick={saveRequest}>Salvar request</Button>
        </div>
      </Panel>

      {result && (
        <Panel title="Response" actions={<CopyButton text={JSON.stringify(result, null, 2)} />}>
          <pre className="text-xs whitespace-pre-wrap overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </Panel>
      )}

      <Panel title="Collections locais" actions={<CopyButton text={JSON.stringify(workspace, null, 2)} />}>
        <div className="space-y-3">
          {workspace.collections.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma collection salva ainda.</p> : null}
          {workspace.collections.map((item) => (
            <div key={item.id} className="rounded border p-3">
              <p className="font-medium text-sm">{item.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.requests.map((request) => (
                  <Button key={request.id} size="sm" variant="outline" onClick={() => {
                    setMethod(request.method);
                    setUrl(request.url);
                    setHeadersText(request.headers.map((header) => `${header.key}: ${header.value}`).join("\n"));
                    setBody(request.body);
                  }}>
                    {request.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <Textarea placeholder="Cole um workspace exportado para importar" className="min-h-[80px] text-xs" onBlur={(e) => e.target.value.trim() && importWorkspace(e.target.value)} />
          {importError && <p className="text-sm text-destructive">{importError}</p>}
        </div>
      </Panel>
    </ToolLayout>
  );
}
