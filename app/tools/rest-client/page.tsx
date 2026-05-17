"use client";

import { useEffect, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import {
  addRecentItem,
  emptyWorkspace,
  loadWorkspace,
  normalizeWorkspace,
  recordRequestRun,
  saveWorkspace,
  upsertRequest,
  type RestRequestItem,
  type RestWorkspace,
} from "@/lib/storage/workspaces";
import { runRestCollection, type RestRunResult } from "@/lib/tools/rest-runner";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type RestClientResult = Record<string, unknown> & { status?: number; ok?: boolean; latencyMs?: number; error?: string };
type RestHeaders = RestRequestItem["headers"];

interface RestRequestDraft {
  method: string;
  url: string;
  headers: RestHeaders;
  body: string;
}

function parseHeaders(headersText: string): RestHeaders {
  return headersText
    .split(/\r?\n/)
    .map((line) => {
      const [key = "", ...rest] = line.split(":");
      return { key: key.trim(), value: rest.join(":").trim() };
    })
    .filter((header) => header.key);
}

function formatHeaders(headers: RestHeaders): string {
  return headers.map((header) => `${header.key}: ${header.value}`).join("\n");
}

function getRequestTitle(requestName: string, method: string, url: string): string {
  return requestName.trim() || `${method} ${url}`;
}

export default function RestClientPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://example.com");
  const [headersText, setHeadersText] = useState("Accept: application/json");
  const [body, setBody] = useState("");
  const [collection, setCollection] = useState("Default");
  const [requestName, setRequestName] = useState("Novo request");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<RestWorkspace>(emptyWorkspace);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [result, setResult] = useState<RestClientResult | null>(null);
  const [runnerResults, setRunnerResults] = useState<RestRunResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningCollectionId, setRunningCollectionId] = useState<string | null>(null);
  const [importError, setImportError] = useState("");

  const headers = parseHeaders(headersText);
  const requestTitle = getRequestTitle(requestName, method, url);

  useEffect(() => {
    setWorkspace(loadWorkspace());
    setWorkspaceLoaded(true);
  }, []);

  async function executeRequest(request: RestRequestDraft): Promise<RestClientResult> {
    const response = await fetch("/api/rest-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return (await response.json()) as RestClientResult;
  }

  async function send() {
    setLoading(true);
    try {
      const data = await executeRequest({ method, url, headers, body });
      setResult(data);
      if (selectedRequestId) {
        const next = recordRequestRun(workspace, selectedRequestId, {
          status: data.status,
          ok: Boolean(data.ok),
          latencyMs: data.latencyMs,
          error: data.error,
        });
        saveWorkspace(next);
        setWorkspace(next);
      }
    } catch (e) {
      setResult({ error: (e as Error).message || "Erro ao executar request" });
    } finally {
      setLoading(false);
    }
  }

  function saveRequest() {
    const collectionName = collection || "Default";
    if (!url.trim()) return;
    const withRequest = upsertRequest(workspace, collectionName, {
      id: selectedRequestId ?? undefined,
      name: requestTitle,
      method,
      url,
      headers,
      body,
    });
    const savedRequest = selectedRequestId
      ? withRequest.collections.flatMap((item) => item.requests).find((item) => item.id === selectedRequestId)
      : withRequest.collections.find((item) => item.name === collectionName)?.requests[0];
    const next = addRecentItem(withRequest, {
      type: "rest-request",
      title: requestTitle,
      href: "/tools/rest-client",
      subtitle: url,
      dedupeKey: `rest:${savedRequest?.id ?? requestTitle}:${url}`,
    });
    setWorkspace(next);
    saveWorkspace(next);
    setSelectedRequestId(savedRequest?.id ?? selectedRequestId);
  }

  function importWorkspace(text: string) {
    try {
      const next = normalizeWorkspace(JSON.parse(text) as unknown);
      saveWorkspace(next);
      setWorkspace(next);
      setImportError("");
    } catch {
      setImportError("Não foi possível importar: JSON inválido ou formato não reconhecido.");
    }
  }

  function loadRequest(request: RestRequestItem, collectionName: string): void {
    setSelectedRequestId(request.id);
    setRequestName(request.name);
    setCollection(collectionName);
    setMethod(request.method);
    setUrl(request.url);
    setHeadersText(formatHeaders(request.headers));
    setBody(request.body);
  }

  async function runCollection(collectionId: string): Promise<void> {
    const target = workspace.collections.find((item) => item.id === collectionId);
    if (!target) return;
    setRunningCollectionId(collectionId);
    try {
      const results = await runRestCollection(target.requests, async (request) => {
        const data = await executeRequest(request);
        return {
          status: data.status,
          ok: Boolean(data.ok),
          latencyMs: data.latencyMs,
        };
      });
      setRunnerResults(results);
      const next = results.reduce(
        (current, item) =>
          recordRequestRun(current, item.requestId, {
            status: item.status,
            ok: item.ok,
            latencyMs: item.latencyMs,
            error: item.error,
          }),
        workspace,
      );
      saveWorkspace(next);
      setWorkspace(next);
    } finally {
      setRunningCollectionId(null);
    }
  }

  return (
    <ToolLayout title="REST Client" description="Execute requests HTTP, salve coleções locais e exporte seu workspace.">
      <Panel title="Request">
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {METHODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono" />
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input value={requestName} onChange={(e) => setRequestName(e.target.value)} placeholder="Nome do request" />
          <Input value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="Collection" />
        </div>
        <label className="text-xs text-muted-foreground mt-3 block">Headers (um por linha)</label>
        <Textarea
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          className="min-h-[90px] font-mono text-xs"
        />
        <label className="text-xs text-muted-foreground mt-3 block">Body</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[120px] font-mono text-xs" />
        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={() => void send()} disabled={loading || !url.trim()}>
            {loading ? "Enviando..." : "Enviar"}
          </Button>
          <Button variant="outline" onClick={saveRequest} disabled={!workspaceLoaded}>
            {selectedRequestId ? "Atualizar request" : "Salvar request"}
          </Button>
          {selectedRequestId && (
            <Button variant="ghost" onClick={() => setSelectedRequestId(null)}>
              Duplicar como novo
            </Button>
          )}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.requests.length} request(s)</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={runningCollectionId === item.id || item.requests.length === 0}
                  onClick={() => void runCollection(item.id)}
                >
                  {runningCollectionId === item.id ? "Executando..." : "Rodar collection"}
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.requests.map((request) => (
                  <Button key={request.id} size="sm" variant="outline" onClick={() => loadRequest(request, item.name)}>
                    {request.name}
                    {request.lastRun ? ` · ${request.lastRun.status ?? "erro"}` : ""}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <Textarea
            placeholder="Cole um workspace exportado para importar"
            className="min-h-[80px] text-xs"
            onBlur={(e) => e.target.value.trim() && importWorkspace(e.target.value)}
          />
          {importError && <p className="text-sm text-destructive">{importError}</p>}
        </div>
      </Panel>

      {runnerResults.length > 0 && (
        <Panel title="Resultado do runner" actions={<CopyButton text={JSON.stringify(runnerResults, null, 2)} />}>
          <div className="space-y-2">
            {runnerResults.map((item) => (
              <div key={item.requestId} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm">
                <span className="font-medium">{item.name}</span>
                <span className={item.ok ? "text-green-600" : "text-destructive"}>
                  {item.ok ? `${item.status ?? "OK"} · ${item.latencyMs ?? 0}ms` : item.error ?? "Falha"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
