"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/tools/copy-button";
import { formatSQL } from "@/lib/tools/sql";
import { Sparkles, Loader2 } from "lucide-react";

export default function SQLPage() {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const format = () => setFormatted(formatSQL(input));

  const explain = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setExplanation("");
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input, type: "sql" }),
      });
      const data = await res.json();
      setExplanation(data.result || data.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout title="Formatador SQL" description="Formate queries SQL e obtenha explicações por IA" hasAI>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="Query SQL"
          actions={<Button size="sm" onClick={format} disabled={!input.trim()}>Formatar</Button>}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"SELECT u.name, COUNT(o.id) as total_orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = 1\nGROUP BY u.id\nORDER BY total_orders DESC\nLIMIT 10"}
            className="min-h-[350px] text-xs"
          />
        </Panel>

        <Panel
          title="SQL Formatado"
          actions={formatted ? <CopyButton text={formatted} /> : undefined}
        >
          <pre className="text-xs font-mono whitespace-pre-wrap min-h-[350px] overflow-auto text-green-300">
            {formatted || <span className="text-muted-foreground">Clique em Formatar para ver o resultado...</span>}
          </pre>
        </Panel>
      </div>

      <Panel
        title="Explicar com IA"
        actions={
          <Button size="sm" variant="outline" onClick={explain} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {loading ? "Explicando..." : "Explicar query"}
          </Button>
        }
      >
        <p className="text-sm min-h-[80px] leading-relaxed">
          {explanation || <span className="text-muted-foreground">A AI irá explicar o que a query faz em português detalhado.</span>}
        </p>
      </Panel>
    </ToolLayout>
  );
}
