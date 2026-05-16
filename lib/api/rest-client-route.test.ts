import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/rest-client/route";

function request(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/rest-client", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/rest-client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks private URLs before fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({ method: "GET", url: "http://10.0.0.1" }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("executes public requests with manual redirect", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({ method: "GET", url: "https://example.com" }));
    const data = (await response.json()) as { body?: string };

    expect(response.status).toBe(200);
    expect(data.body).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith("https://example.com", expect.objectContaining({ redirect: "manual" }));
  });

  it("forwards explicit authorization headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(request({
      method: "GET",
      url: "https://example.com",
      headers: [{ key: "Authorization", value: "Bearer token" }],
    }));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer token");
  });
});
