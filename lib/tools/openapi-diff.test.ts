import { describe, expect, it } from "vitest";
import { diffOpenApi, openApiToRequests } from "./openapi-diff";

describe("openapi diff", () => {
  it("detects removed methods and generates requests", () => {
    const before = '{"openapi":"3.0.0","paths":{"/users":{"get":{},"post":{}}}}';
    const after = '{"openapi":"3.0.0","paths":{"/users":{"get":{}}}}';
    expect(diffOpenApi(before, after)).toEqual(["BREAKING: método removido POST /users"]);
    expect(openApiToRequests(before)).toContainEqual({ method: "GET", path: "/users" });
  });
});
