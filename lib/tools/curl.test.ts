import { describe, expect, it } from "vitest";
import { parseCurl, toFetchSnippet } from "./curl";

describe("curl tools", () => {
  it("parses method headers and body", () => {
    const parsed = parseCurl("curl -X POST https://api.test/users -H 'Content-Type: application/json' -d '{\"a\":1}'");
    expect(parsed.result).toMatchObject({
      method: "POST",
      url: "https://api.test/users",
      body: "{\"a\":1}",
    });
    expect(parsed.result?.headers).toEqual([{ key: "Content-Type", value: "application/json" }]);
  });

  it("generates fetch snippet", () => {
    const parsed = parseCurl("curl https://example.com");
    expect(toFetchSnippet(parsed.result!)).toContain("fetch");
  });
});
