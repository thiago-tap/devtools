import { describe, expect, it } from "vitest";
import {
  addRecentItem,
  emptyWorkspace,
  normalizeWorkspace,
  recordRequestRun,
  saveQrCode,
  upsertRequest,
} from "./workspaces";

const opts = { id: () => "id-1", now: () => "2026-05-17T19:00:00.000Z" };

describe("workspace storage model", () => {
  it("creates a v2 workspace with local-first sections", () => {
    expect(emptyWorkspace()).toMatchObject({
      version: 2,
      collections: [],
      environments: [],
      recentItems: [],
      qrCodes: [],
    });
  });

  it("migrates legacy v1 workspaces", () => {
    const migrated = normalizeWorkspace({
      version: 1,
      collections: [{ id: "c1", name: "Default", requests: [], createdAt: "old" }],
      environments: [],
    });

    expect(migrated.version).toBe(2);
    expect(migrated.collections).toHaveLength(1);
    expect(migrated.qrCodes).toEqual([]);
    expect(migrated.recentItems).toEqual([]);
  });

  it("saves QR codes and recent items with newest first", () => {
    const withQr = saveQrCode(emptyWorkspace(), { text: "https://example.com", dataUrl: "data:image/png;base64,abc" }, opts);
    const withRecent = addRecentItem(withQr, { type: "qr-code", title: "QR Code", href: "/tools/qr-code", subtitle: "https://example.com" }, opts);

    expect(withRecent.qrCodes[0]).toMatchObject({ id: "id-1", text: "https://example.com" });
    expect(withRecent.recentItems[0]).toMatchObject({ id: "id-1", type: "qr-code", title: "QR Code" });
  });

  it("upserts requests and records last run metadata", () => {
    const workspace = upsertRequest(
      emptyWorkspace(),
      "Default",
      { name: "List users", method: "GET", url: "https://api.example.com/users", headers: [], body: "" },
      opts,
    );
    const requestId = workspace.collections[0].requests[0].id;
    const withRun = recordRequestRun(workspace, requestId, { status: 200, ok: true, latencyMs: 120 }, opts);

    expect(workspace.collections[0].requests[0]).toMatchObject({ name: "List users", id: "id-1" });
    expect(withRun.collections[0].requests[0].lastRun).toMatchObject({ status: 200, ok: true, latencyMs: 120 });
  });

  it("moves an existing request when upserting into another collection", () => {
    const workspace = upsertRequest(
      emptyWorkspace(),
      "A",
      { name: "Request", method: "GET", url: "https://api.example.com/a", headers: [], body: "" },
      opts,
    );
    const requestId = workspace.collections[0].requests[0].id;
    const moved = upsertRequest(
      workspace,
      "B",
      { id: requestId, name: "Request moved", method: "GET", url: "https://api.example.com/b", headers: [], body: "" },
      { id: () => "id-2", now: () => "2026-05-17T19:02:00.000Z" },
    );

    expect(moved.collections.find((item) => item.name === "A")?.requests).toEqual([]);
    expect(moved.collections.find((item) => item.name === "B")?.requests[0]).toMatchObject({
      id: requestId,
      name: "Request moved",
      url: "https://api.example.com/b",
    });
  });

  it("deduplicates recent items by explicit key when available", () => {
    const workspace = addRecentItem(
      addRecentItem(emptyWorkspace(), { type: "rest-request", title: "A", href: "/tools/rest-client", subtitle: "same", dedupeKey: "request-a" }, opts),
      { type: "rest-request", title: "B", href: "/tools/rest-client", subtitle: "same", dedupeKey: "request-b" },
      { id: () => "id-2", now: () => "2026-05-17T19:01:00.000Z" },
    );

    expect(workspace.recentItems.map((item) => item.title)).toEqual(["B", "A"]);
  });
});
