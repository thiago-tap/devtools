import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRembgBaseUrl,
  isRembgConfigured,
  isRembgHeavyAction,
  removeBackgroundViaRembg,
} from "./rembg";

describe("rembg", () => {
  beforeEach(() => {
    delete process.env.REMBG_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getRembgBaseUrl normaliza barra final", () => {
    process.env.REMBG_BASE_URL = "http://rembg:7000/";
    expect(getRembgBaseUrl()).toBe("http://rembg:7000");
  });

  it("isRembgConfigured false sem env", () => {
    delete process.env.REMBG_BASE_URL;
    expect(isRembgConfigured()).toBe(false);
  });

  it("isRembgHeavyAction identifica ações custosas", () => {
    expect(isRembgHeavyAction("remove_bg")).toBe(true);
    expect(isRembgHeavyAction("preset_dtf_transparent")).toBe(true);
    expect(isRembgHeavyAction("metadata")).toBe(false);
  });

  it("removeBackgroundViaRembg envia multipart e retorna PNG", async () => {
    process.env.REMBG_BASE_URL = "http://127.0.0.1:7000";
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string | URL) => {
        expect(String(url)).toBe("http://127.0.0.1:7000/api/remove");
        return new Response(png, { status: 200, headers: { "Content-Type": "image/png" } });
      })
    );

    const out = await removeBackgroundViaRembg(Buffer.from("fake"), "x.png", "image/png", {
      timeoutMs: 5000,
    });
    expect(out.equals(png)).toBe(true);
  });

  it("removeBackgroundViaRembg lança se Rembg retorna erro HTTP", async () => {
    process.env.REMBG_BASE_URL = "http://127.0.0.1:7000";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("model missing", { status: 500 }))
    );
    await expect(
      removeBackgroundViaRembg(Buffer.from("x"), "a.jpg", "image/jpeg")
    ).rejects.toThrow("Rembg respondeu 500");
  });
});
