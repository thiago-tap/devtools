import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/meta-preview/route";

function request(url: string): NextRequest {
  return new NextRequest("http://localhost/api/meta-preview", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

describe("POST /api/meta-preview", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks redirects to private URLs before following them", async () => {
    const headers = new Headers({ location: "http://169.254.169.254/latest/meta-data" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request("https://example.com/page"));
    const data = (await response.json()) as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("Redirecionamento para URL não permitida");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows safe redirects and extracts metadata", async () => {
    const redirectHeaders = new Headers({ location: "https://www.example.com/page" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: redirectHeaders }))
      .mockResolvedValueOnce(
        new Response('<html><head><meta property="og:title" content="Example"></head></html>', {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request("https://example.com/page"));
    const data = (await response.json()) as { finalUrl?: string; meta?: { title?: string } };

    expect(response.status).toBe(200);
    expect(data.finalUrl).toBe("https://www.example.com/page");
    expect(data.meta?.title).toBe("Example");
  });
});
