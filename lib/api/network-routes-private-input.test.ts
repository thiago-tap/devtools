import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as corsPost } from "@/app/api/cors-probe/route";
import { POST as headersPost } from "@/app/api/headers/route";
import { POST as httpStatusPost } from "@/app/api/http-status/route";

function request(path: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("network API private input guards", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks private URLs before CORS probe fetches", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await corsPost(request("/api/cors-probe", { url: "https://10.0.0.1", origin: "*" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks private URLs before headers fetches", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await headersPost(request("/api/headers", { url: "https://10.0.0.1" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks private URLs before http-status fetches", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await httpStatusPost(request("/api/http-status", { url: "https://10.0.0.1" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks private redirect locations in headers and CORS routes", async () => {
    const headers = new Headers({ location: "http://10.0.0.1/private" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers }));
    vi.stubGlobal("fetch", fetchMock);

    expect((await headersPost(request("/api/headers", { url: "https://example.com" }))).status).toBe(400);
    expect((await corsPost(request("/api/cors-probe", { url: "https://example.com", origin: "*" }))).status).toBe(400);
  });
});
