import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/ai/diagnose/route";

describe("POST /api/ai/diagnose", () => {
  it("rejects oversized AI input before model call", async () => {
    const response = await POST(new NextRequest("http://localhost/api/ai/diagnose", {
      method: "POST",
      body: JSON.stringify({ input: "x".repeat(12_001) }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("Entrada excede") });
  });
});
