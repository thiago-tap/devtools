"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/tools/copy-button";
import { describeCron, getNextExecutions } from "@/lib/tools/cron";
import { AlertCircle } from "lucide-react";

const PRESETS = [
  { label: "Todo minuto", value: "* * * * *" },
  { label: "A cada hora", value: "0 * * * *" },
  { label: "Todo dia à meia-noite", value: "0 0 * * *" },
  { label: "Todo dia ao meio-dia", value: "0 12 * * *" },
  { label: "Segunda-feira às 9h", value: "0 9 * * 1" },
  { label: "Dias úteis às 8h", value: "0 8 * * 1-5" },
  { label: "1º de cada mês", value: "0 0 1 * *" },
  { label: "A cada 15 minutos", value: "*/15 * * * *" },
  { label: "A cada 6 horas", value: "0 */6 * * *" },
];

export default function CronPage() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const result = describeCron(expression);
  const nextRuns = result.error ? [] : getNextExecutions(expression, 5);

  const parts = expression.trim().split(/\s+/);

  return (
    <ToolLayout title="Interpretador Cron" description="Interprete e gere expressões cron com descrição em português">
      <Panel title="Expressão Cron">
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="font-mono text-lg tracking-widest"
              placeholder="* * * * *"
            />
            <CopyButton text={expression} />
          </div>

          {/* Field labels */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {["Minuto\n(0-59)", "Hora\n(0-23)", "Dia do Mês\n(1-31)", "Mês\n(1-12)", "Dia da Semana\n(0-6)"].map((label, i) => (
              <div key={i} className="rounded bg-muted p-2">
                <code className="text-sm font-mono font-bold text-primary">
                  {parts[i] ?? "*"}
                </code>
                <p className="text-[10px] text-muted-foreground mt-1 whitespace-pre-line leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            variant={expression === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setExpression(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {result.error ? (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{result.error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Descrição">
            <p className="text-lg font-medium">{result.description}</p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">{expression}</p>
          </Panel>

          <Panel title="Próximas execuções">
            <div className="space-y-2">
              {nextRuns.map((date, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{i + 1}</Badge>
                  <span className="text-sm font-mono">{date.toLocaleString("pt-BR")}</span>
                </div>
              ))}
              {nextRuns.length === 0 && (
                <p className="text-muted-foreground text-sm">Não foi possível calcular as próximas execuções.</p>
              )}
            </div>
          </Panel>
        </div>
      )}
    </ToolLayout>
  );
}
