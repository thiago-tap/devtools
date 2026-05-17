import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "node -e \"const fs=require('fs'); for (const p of ['.next/static','.next/standalone','public']) { if (!fs.existsSync(p)) { console.error('Missing '+p+'. Run npm run build before npm run e2e.'); process.exit(1); } } fs.cpSync('.next/static','.next/standalone/.next/static',{recursive:true}); fs.cpSync('public','.next/standalone/public',{recursive:true});\" && node .next/standalone/server.js",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
