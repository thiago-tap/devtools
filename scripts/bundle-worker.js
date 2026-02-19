const { buildSync } = require("esbuild");
const path = require("path");

// Bare Node.js built-in names (CJS require() style, no "node:" prefix)
// These are called via __require() in the esbuild bundle and need the
// require polyfill injected via banner to work in Cloudflare Workers ESM.
const nodeBuiltins = [
  "async_hooks", "fs", "path", "buffer", "crypto", "stream", "events",
  "url", "util", "os", "net", "tls", "http", "https", "zlib", "assert",
  "dns", "string_decoder", "querystring", "http2", "perf_hooks",
  "worker_threads", "vm", "module", "v8", "process", "readline", "repl",
  "timers", "constants",
];

// Inject a require() function at the top of the ESM bundle using
// createRequire so that CJS require("fs") etc. work in Cloudflare Workers
// with the nodejs_compat flag.
const requirePolyfill = [
  `import { createRequire as __createRequire } from "node:module";`,
  `const require = __createRequire("file:///worker.js");`,
].join("\n");

try {
  buildSync({
    entryPoints: [path.join("scripts", "worker-wrapper.js")],
    bundle: true,
    outfile: path.join(".open-next", "assets", "_worker.js"),
    format: "esm",
    conditions: ["workerd"],
    external: [...nodeBuiltins, "node:*", "cloudflare:*"],
    platform: "browser",
    banner: { js: requirePolyfill },
    logLevel: "info",
  });
  console.log("✅ Worker bundled to .open-next/assets/_worker.js");
} catch (e) {
  console.error("❌ Worker bundling failed:", e.message);
  process.exit(1);
}
