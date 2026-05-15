import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tools = [
  "json", "regex", "base64", "jwt", "secrets", "hash", "colors", "password",
  "uuid", "diff", "markdown", "code-review", "sql", "cron", "timestamp", "mime",
  "dns", "headers", "yaml", "env", "base-converter",
];

const template = (id) => `import type { Metadata } from "next";
import { metadataForTool } from "@/lib/seo";

export const metadata: Metadata = metadataForTool("${id}");

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`;

for (const id of tools) {
  const dir = join(root, "app", "tools", id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "layout.tsx"), template(id));
  console.log("layout:", id);
}
