import { describe, expect, it } from "vitest";
import {
  computeExtendedDigests,
  generateHmac,
  md5,
  timingSafeEqual,
} from "./hash";

describe("hash", () => {
  it("md5 known vector", () => {
    expect(md5("hello")).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("extended digests are stable length", async () => {
    const r = computeExtendedDigests("test", false);
    expect(r["SHA3-256"]).toHaveLength(64);
    expect(r["SHA3-512"]).toHaveLength(128);
    expect(r.BLAKE2b).toHaveLength(128);
  });

  it("hmac sha256", async () => {
    const h = await generateHmac("payload", "secret", "SHA-256", false);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("timingSafeEqual", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
  });
});
