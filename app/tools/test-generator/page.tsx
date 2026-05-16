"use client";

import { useState, type ChangeEvent } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";

function localTestSkeleton(input: string): string {
  return `import { describe, expect, it } from "vitest";\n\ndescribe("generated tests", () => {\n  it("handles the main happy path", () => {\n    // Arrange\n    const input = ${JSON.stringify(input.slice(0, 200))};\n\n    // Act\n    const result = input;\n\n    // Assert\n    expect(result).toBeDefined();\n  });\n});\n`;
}

export default function TestGeneratorPage() {
  const [input, setInput] = useState("function sum(a, b) { return a + b }");
  const [result, setResult] = useState(localTestSkeleton(input));
  const [loading, setLoading] = useState(false);

  async function runAi() {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "gerador de testes Vitest/Jest/Playwright", input }),
      });
      const data = await response.json();
      setResult(data.result ?? data.error ?? localTestSkeleton(input));
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    const nextInput = event.target.value;
    setInput(nextInput);
    setResult(localTestSkeleton(nextInput));
  }

  return (
    <ToolLayout title="Test Generator" description="Gere esqueleto de testes localmente ou peça sugestões com IA." hasAI>
      <Panel title="Código, contrato ou payload">
        <Textarea value={input} onChange={handleInputChange} className="min-h-[220px] font-mono text-xs" />
        <Button className="mt-3" variant="outline" onClick={() => void runAi()} disabled={loading || !input.trim()}>
          {loading ? "Gerando..." : "Sugerir com IA"}
        </Button>
      </Panel>
      <Panel title="Teste sugerido" actions={<CopyButton text={result} />}>
        <pre className="text-xs whitespace-pre-wrap">{result}</pre>
      </Panel>
    </ToolLayout>
  );
}
