import type { RestRequestItem } from "@/lib/storage/workspaces";

export interface RestRunResult {
  requestId: string;
  name: string;
  ok: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
}

export async function runRestCollection(
  requests: RestRequestItem[],
  execute: (request: RestRequestItem) => Promise<{ status?: number; ok: boolean; latencyMs?: number }>,
): Promise<RestRunResult[]> {
  const results: RestRunResult[] = [];

  for (const request of requests) {
    try {
      const result = await execute(request);
      results.push({
        requestId: request.id,
        name: request.name,
        ok: result.ok,
        status: result.status,
        latencyMs: result.latencyMs,
      });
    } catch (e) {
      results.push({
        requestId: request.id,
        name: request.name,
        ok: false,
        error: e instanceof Error ? e.message : "Falha ao executar request",
      });
    }
  }

  return results;
}
