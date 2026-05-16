import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/jwks/route";

function request(url: string): NextRequest {
  return new NextRequest("http://localhost/api/jwks", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

describe("POST /api/jwks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects HTTP, private IPv4 and private IPv6 URLs before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await POST(request("http://example.com/jwks.json"))).status).toBe(400);
    expect((await POST(request("https://10.0.0.1/jwks.json"))).status).toBe(400);
    expect((await POST(request("https://[::1]/jwks.json"))).status).toBe(400);
    expect((await POST(request("https://[::ffff:7f00:1]/jwks.json"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-JWKS JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    const response = await POST(request("https://example.com/jwks.json"));

    expect(response.status).toBe(422);
  });

  it("filters proxied JWK fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ keys: [{ kty: "RSA", kid: "1", n: "abc", e: "AQAB", x5c: ["large"] }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const response = await POST(request("https://example.com/jwks.json"));
    const data = (await response.json()) as { keys: Array<Record<string, unknown>> };

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/jwks.json",
      expect.objectContaining({ redirect: "error" }),
    );
    expect(data.keys).toEqual([{ kty: "RSA", kid: "1", n: "abc", e: "AQAB" }]);
  });
});
