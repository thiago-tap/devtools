// Worker wrapper: serve static assets via env.ASSETS before
// delegating dynamic requests to the OpenNext Next.js handler.
// This is needed because in Cloudflare Pages Advanced Mode (_worker.js),
// static files are NOT automatically served – the worker handles everything.

//@ts-expect-error: resolved at bundle time
import openNextWorker from "../.open-next/worker.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve Next.js static assets directly from Cloudflare Pages asset storage
    if (
      pathname.startsWith("/_next/static/") ||
      pathname.startsWith("/_next/data/") ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml"
    ) {
      const assetResponse = await env.ASSETS?.fetch(request);
      if (assetResponse && assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    // Delegate everything else to the OpenNext worker
    return openNextWorker.fetch(request, env, ctx);
  },
};

// Re-export Durable Object handlers from OpenNext
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";
