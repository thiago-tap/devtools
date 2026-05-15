import { describe, expect, it } from "vitest";
import { jsonToYaml, yamlToJson } from "./yaml-json";

describe("yaml-json", () => {
  it("yaml to json", () => {
    const r = yamlToJson("app: devtools\nversion: 1");
    expect(r.error).toBeUndefined();
    expect(JSON.parse(r.result)).toEqual({ app: "devtools", version: 1 });
  });

  it("json to yaml", () => {
    const r = jsonToYaml('{"ok":true}');
    expect(r.error).toBeUndefined();
    expect(r.result).toContain("ok:");
  });
});
