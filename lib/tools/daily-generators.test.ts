import { describe, expect, it } from "vitest";
import { generateIgnoreFile } from "./ignore-generator";
import { formatLogLines, parseLogLines } from "./logs";
import { generateRobotsTxt, generateSitemapXml } from "./web-standards";

describe("daily generators", () => {
  it("generates ignore files", () => {
    expect(generateIgnoreFile(["Next.js"])).toContain(".next/");
  });

  it("parses and filters logs", () => {
    const lines = parseLogLines('{"level":"error","message":"boom"}\ninfo ok');
    expect(formatLogLines(lines, "boom")).toContain("boom");
  });

  it("generates web standard files", () => {
    expect(generateRobotsTxt("https://example.com")).toContain("Sitemap");
    expect(generateSitemapXml(["https://example.com?a=1&b=2"])).toContain("&amp;");
  });
});
