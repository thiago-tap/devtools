import { describe, expect, it } from "vitest";
import { runRestCollection } from "./rest-runner";
import type { RestRequestItem } from "@/lib/storage/workspaces";

const requests: RestRequestItem[] = [
  { id: "r1", name: "First", method: "GET", url: "https://a.test", headers: [], body: "", createdAt: "now", updatedAt: "now" },
  { id: "r2", name: "Second", method: "GET", url: "https://b.test", headers: [], body: "", createdAt: "now", updatedAt: "now" },
];

describe("runRestCollection", () => {
  it("runs requests sequentially and keeps per-request failures", async () => {
    const order: string[] = [];
    const results = await runRestCollection(requests, async (request) => {
      order.push(request.id);
      if (request.id === "r2") throw new Error("boom");
      return { status: 200, ok: true, latencyMs: 10 };
    });

    expect(order).toEqual(["r1", "r2"]);
    expect(results).toEqual([
      { requestId: "r1", name: "First", ok: true, status: 200, latencyMs: 10 },
      { requestId: "r2", name: "Second", ok: false, error: "boom" },
    ]);
  });
});
