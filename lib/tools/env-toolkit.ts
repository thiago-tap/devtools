import { parseEnvLines } from "@/lib/tools/env-formatter";

export function compareEnvFiles(envText: string, exampleText: string): {
  missingInEnv: string[];
  missingInExample: string[];
  emptyValues: string[];
  duplicateKeys: string[];
  sanitizedExample: string;
} {
  const env = parseEnvLines(envText).lines;
  const example = parseEnvLines(exampleText).lines;
  const envKeys = new Set(env.map((line) => line.key));
  const exampleKeys = new Set(example.map((line) => line.key));
  const seen = new Set<string>();
  const duplicateKeys = env.map((line) => line.key).filter((key) => {
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });

  return {
    missingInEnv: [...exampleKeys].filter((key) => !envKeys.has(key)),
    missingInExample: [...envKeys].filter((key) => !exampleKeys.has(key)),
    emptyValues: env.filter((line) => !line.value).map((line) => line.key),
    duplicateKeys,
    sanitizedExample: env.map((line) => `${line.key}=`).join("\n"),
  };
}
