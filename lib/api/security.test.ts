import { describe, expect, it } from "vitest";
import { isBlockedHostname, isBlockedUrl } from "./security";

describe("api security guards", () => {
  it("blocks private IPv4 and IPv6 literals", () => {
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("10.0.0.1")).toBe(true);
    expect(isBlockedHostname("100.64.0.1")).toBe(true);
    expect(isBlockedHostname("172.16.0.1")).toBe(true);
    expect(isBlockedHostname("192.168.0.1")).toBe(true);
    expect(isBlockedHostname("169.254.169.254")).toBe(true);
    expect(isBlockedHostname("[::1]")).toBe(true);
    expect(isBlockedHostname("fe90::1")).toBe(true);
    expect(isBlockedHostname("fd00::1")).toBe(true);
    expect(isBlockedHostname("::ffff:7f00:1")).toBe(true);
    expect(isBlockedUrl("https://[::1]/jwks.json")).toBe(true);
    expect(isBlockedUrl("https://[::ffff:7f00:1]/jwks.json")).toBe(true);
  });

  it("blocks local hostnames and non-http protocols", () => {
    expect(isBlockedUrl("https://localhost/test")).toBe(true);
    expect(isBlockedUrl("https://service.local/test")).toBe(true);
    expect(isBlockedUrl("https://service.internal/test")).toBe(true);
    expect(isBlockedUrl("file:///etc/passwd")).toBe(true);
  });

  it("allows public HTTPS URLs", () => {
    expect(isBlockedUrl("https://example.com/.well-known/jwks.json")).toBe(false);
  });
});
