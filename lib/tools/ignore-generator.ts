const PRESETS: Record<string, string[]> = {
  "Next.js": [".next/", "out/", "node_modules/", ".env*", "!.env.example"],
  Node: ["node_modules/", "npm-debug.log*", "dist/", "coverage/", ".env*"],
  Python: ["__pycache__/", "*.py[cod]", ".venv/", "dist/", ".env"],
  Docker: [".git/", "node_modules/", ".next/", "coverage/", "*.log"],
  Laravel: ["/vendor/", "/node_modules/", ".env", "/storage/*.key", "/public/hot"],
  OS: [".DS_Store", "Thumbs.db"],
};

export function listIgnorePresets(): string[] {
  return Object.keys(PRESETS);
}

export function generateIgnoreFile(presets: string[]): string {
  const lines = presets.flatMap((preset) => [`# ${preset}`, ...(PRESETS[preset] ?? []), ""]);
  return [...new Set(lines)].join("\n").trim() + "\n";
}
