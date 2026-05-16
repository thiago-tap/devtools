"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/tools/copy-button";
import { diffOpenApi, openApiToRequests, parseOpenApi } from "@/lib/tools/openapi-diff";

type OpenApiDoc = {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, Record<string, { parameters?: unknown[]; requestBody?: unknown; responses?: Record<string, unknown> }>>;
};

const METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;
type OpenApiMethod = (typeof METHODS)[number];

function isOpenApiMethod(method: string): method is OpenApiMethod {
  return METHODS.includes(method as OpenApiMethod);
}

export default function OpenApiPage() {
  const [input, setInput] = useState('{\n  "openapi": "3.0.0",\n  "info": { "title": "Minha API", "version": "1.0.0" },\n  "paths": { "/users": { "get": {}, "post": {} } }\n}');
  const [compareInput, setCompareInput] = useState("");
  const result = useMemo(() => {
    try {
      const doc = parseOpenApi(input) as OpenApiDoc;
      const errors: string[] = [];
      if (!doc.openapi && !doc.swagger) errors.push("Campo openapi/swagger ausente.");
      if (!doc.info?.title) errors.push("info.title ausente.");
      if (!doc.paths || typeof doc.paths !== "object") errors.push("paths ausente.");
      const endpoints = Object.entries(doc.paths ?? {}).flatMap(([path, methods]) =>
        Object.keys(methods)
          .filter(isOpenApiMethod)
          .map((method) => {
            const op = methods[method];
            const responses = Object.keys(op?.responses ?? {}).join(", ") || "sem responses";
            const hasBody = op?.requestBody ? "body" : "sem body";
            const params = op?.parameters?.length ?? 0;
            return `${method.toUpperCase()} ${path} · ${responses} · ${hasBody} · ${params} parâmetro(s)`;
          }),
      );
      return { errors, endpoints, title: doc.info?.title ?? "Sem título", version: doc.info?.version ?? "sem versão" };
    } catch (e) {
      return { errors: [(e as Error).message], endpoints: [], title: "", version: "" };
    }
  }, [input]);
  const diff = useMemo(() => {
    if (!compareInput.trim()) return { items: [], error: "" };
    try {
      return { items: diffOpenApi(input, compareInput), error: "" };
    } catch (e) {
      return { items: [], error: (e as Error).message };
    }
  }, [compareInput, input]);
  const requests = useMemo(() => {
    try {
      return openApiToRequests(input);
    } catch {
      return [];
    }
  }, [input]);

  return (
    <ToolLayout title="OpenAPI Viewer" description="Resumo, diff básico e geração de requests a partir de OpenAPI/Swagger.">
      <Panel title="Spec OpenAPI">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[360px] text-xs" />
      </Panel>
      <Panel title="Resumo">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant={result.errors.length ? "destructive" : "success"}>{result.errors.length ? "Com avisos" : "Parece válido"}</Badge>
          <Badge variant="outline">{result.title}</Badge>
          <Badge variant="outline">{result.version}</Badge>
          <Badge variant="outline">{result.endpoints.length} endpoint(s)</Badge>
        </div>
        {result.errors.length > 0 && <ul className="text-sm text-destructive mb-3">{result.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {result.endpoints.map((endpoint) => <code key={endpoint} className="rounded bg-muted p-2 text-xs">{endpoint}</code>)}
        </div>
      </Panel>
      <Panel title="Requests gerados" actions={<CopyButton text={JSON.stringify(requests, null, 2)} />}>
        <div className="flex flex-wrap gap-2">
          {requests.map((request) => <code key={`${request.method}-${request.path}`} className="rounded bg-muted p-2 text-xs">{request.method} {request.path}</code>)}
        </div>
      </Panel>
      <Panel title="Comparar com nova versão">
        <Textarea value={compareInput} onChange={(e) => setCompareInput(e.target.value)} placeholder="Cole a nova spec para ver breaking changes básicos" className="min-h-[220px] text-xs" />
        {diff.error && <p className="mt-3 text-sm text-destructive">{diff.error}</p>}
        {diff.items.length > 0 && <ul className="mt-3 text-sm space-y-1">{diff.items.map((item) => <li key={item}>{item}</li>)}</ul>}
      </Panel>
    </ToolLayout>
  );
}
