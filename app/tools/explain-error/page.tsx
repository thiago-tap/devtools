"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";

export default function ExplainErrorPage() {
  const [input, setInput] = useState("TypeError: Cannot read properties of undefined");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "erro/stack trace", input }),
      });
      const data = await response.json();
      setResult(data.result ?? data.error ?? "Sem resposta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout title="Explique esse erro" description="Cole stack trace, logs ou mensagens de build e peça um diagnóstico." hasAI>
      <Panel title="Erro ou log">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[260px] font-mono text-xs" />
        <Button className="mt-3" onClick={() => void run()} disabled={loading || !input.trim()}>
          {loading ? "Analisando..." : "Analisar com IA"}
        </Button>
      </Panel>
      {result && <Panel title="Diagnóstico" actions={<CopyButton text={result} />}><p className="text-sm whitespace-pre-wrap">{result}</p></Panel>}
    </ToolLayout>
  );
}
