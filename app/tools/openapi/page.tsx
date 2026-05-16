"use client";

import { useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type OpenApiDoc = {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, Record<string, unknown>>;
};

const METHODS = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

export default function OpenApiPage() {
  const [input, setInput] = useState('{\n  "openapi": "3.0.0",\n  "info": { "title": "Minha API", "version": "1.0.0" },\n  "paths": { "/users": { "get": {}, "post": {} } }\n}');
  const result = useMemo(() => {
    try {
      const doc = JSON.parse(input) as OpenApiDoc;
      const errors: string[] = [];
      if (!doc.openapi && !doc.swagger) errors.push("Campo openapi/swagger ausente.");
      if (!doc.info?.title) errors.push("info.title ausente.");
      if (!doc.paths || typeof doc.paths !== "object") errors.push("paths ausente.");
      const endpoints = Object.entries(doc.paths ?? {}).flatMap(([path, methods]) =>
        Object.keys(methods)
          .filter((method) => METHODS.includes(method as (typeof METHODS)[number]))
          .map((method) => `${method.toUpperCase()} ${path}`),
      );
      return { errors, endpoints, title: doc.info?.title ?? "Sem título", version: doc.info?.version ?? "sem versão" };
    } catch (e) {
      return { errors: [(e as Error).message], endpoints: [], title: "", version: "" };
    }
  }, [input]);

  return (
    <ToolLayout title="OpenAPI Viewer" description="Resumo rápido de specs OpenAPI/Swagger em JSON.">
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
    </ToolLayout>
  );
}
