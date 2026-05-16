import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/redirect-chain/route";

function request(url: string): NextRequest {
  return new NextRequest("http://localhost/api/redirect-chain", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

describe("POST /api/redirect-chain", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks redirects to private URLs before following them", async () => {
    const headers = new Headers({ location: "http://10.0.0.1/latest/meta-data" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request("https://example.com/start"));
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("Redirecionamento para URL não permitida");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
