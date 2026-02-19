const { buildSync } = require("esbuild");
const path = require("path");

const nodeBuiltins = [
  "async_hooks", "fs", "path", "buffer", "crypto", "stream", "events",
  "url", "util", "os", "net", "tls", "http", "https", "zlib", "assert",
  "dns", "string_decoder", "querystring", "http2", "perf_hooks",
  "worker_threads", "vm", "module", "v8", "process", "readline", "repl",
  "timers", "constants",
];

try {
  buildSync({
    entryPoints: [path.join(".open-next", "worker.js")],
    bundle: true,
    outfile: path.join(".open-next", "assets", "_worker.js"),
    format: "esm",
    conditions: ["workerd"],
    external: [...nodeBuiltins, "node:*", "cloudflare:*"],
    platform: "browser",
    logLevel: "info",
  });
  console.log("✅ Worker bundled to .open-next/assets/_worker.js");
} catch (e) {
  console.error("❌ Worker bundling failed:", e.message);
  process.exit(1);
}
