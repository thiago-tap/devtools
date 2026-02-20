"use client";
import { useState, useEffect } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { RefreshCw, AlertCircle } from "lucide-react";

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const prefix = future ? "daqui a" : "há";
  if (abs < 5_000) return "agora";
  if (abs < 60_000) return `${prefix} ${Math.floor(abs / 1_000)}s`;
  if (abs < 3_600_000) return `${prefix} ${Math.floor(abs / 60_000)} min`;
  if (abs < 86_400_000) return `${prefix} ${Math.floor(abs / 3_600_000)}h`;
  if (abs < 2_592_000_000) return `${prefix} ${Math.floor(abs / 86_400_000)} dia(s)`;
  if (abs < 31_536_000_000) return `${prefix} ${Math.floor(abs / 2_592_000_000)} mês(es)`;
  return `${prefix} ${Math.floor(abs / 31_536_000_000)} ano(s)`;
}

function toFormats(date: Date): { label: string; value: string }[] {
  return [
    { label: "Unix (segundos)", value: String(Math.floor(date.getTime() / 1000)) },
    { label: "Unix (milissegundos)", value: String(date.getTime()) },
    { label: "ISO 8601", value: date.toISOString() },
    { label: "UTC", value: date.toUTCString() },
    { label: "Local", value: date.toLocaleString("pt-BR") },
    { label: "Data", value: date.toLocaleDateString("pt-BR") },
    { label: "Hora", value: date.toLocaleTimeString("pt-BR") },
    { label: "Dia da semana", value: date.toLocaleDateString("pt-BR", { weekday: "long" }) },
    { label: "Relativo", value: getRelativeTime(date) },
  ];
}

export default function TimestampPage() {
  const [now, setNow] = useState(() => new Date());
  const [tsInput, setTsInput] = useState("");
  const [tsResult, setTsResult] = useState<{ label: string; value: string }[] | null>(null);
  const [tsError, setTsError] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [dateResult, setDateResult] = useState<{ unix: string; ms: string } | null>(null);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const convertTs = () => {
    setTsError(""); setTsResult(null);
    const val = tsInput.trim();
    if (!val) return;
    const num = Number(val);
    if (isNaN(num)) { setTsError("Digite um número válido"); return; }
    const date = num > 1e12 ? new Date(num) : new Date(num * 1000);
    if (isNaN(date.getTime())) { setTsError("Timestamp inválido"); return; }
    setTsResult(toFormats(date));
  };

  const convertDate = () => {
    setDateError(""); setDateResult(null);
    const val = dateInput.trim();
    if (!val) return;
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      setDateError("Data inválida. Use formato como: 2024-01-15 ou 2024-01-15T10:30:00");
      return;
    }
    setDateResult({
      unix: String(Math.floor(date.getTime() / 1000)),
      ms: String(date.getTime()),
    });
  };

  const nowUnix = Math.floor(now.getTime() / 1000);

  return (
    <ToolLayout title="Conversor de Timestamp" description="Converta timestamps Unix para datas legíveis e vice-versa">
      {/* Live clock */}
      <Panel title="Agora">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Unix (segundos)", value: String(nowUnix) },
            { label: "Unix (ms)", value: String(now.getTime()) },
            { label: "UTC", value: now.toUTCString() },
            { label: "Local", value: now.toLocaleString("pt-BR") },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1.5 p-3 rounded-md bg-muted/30">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="flex items-center justify-between gap-1">
                <code className="text-xs font-mono truncate flex-1">{value}</code>
                <CopyButton text={value} size="icon" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Timestamp → Date */}
      <Panel title="Timestamp → Data">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && convertTs()}
              placeholder="Ex: 1700000000 ou 1700000000000"
              className="font-mono"
            />
            <Button onClick={convertTs} disabled={!tsInput.trim()}>Converter</Button>
            <Button
              variant="outline"
              title="Usar timestamp atual"
              onClick={() => { setTsInput(String(nowUnix)); setTsError(""); setTsResult(null); }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {tsError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {tsError}
            </div>
          )}

          {tsResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tsResult.map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
                  <code className="text-xs font-mono flex-1 truncate">{value}</code>
                  <CopyButton text={value} size="icon" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* Date → Timestamp */}
      <Panel title="Data → Timestamp">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && convertDate()}
              placeholder="Ex: 2024-01-15 ou 2024-01-15T10:30:00"
              className="font-mono"
            />
            <Button onClick={convertDate} disabled={!dateInput.trim()}>Converter</Button>
            <Button
              variant="outline"
              title="Usar data atual"
              onClick={() => {
                setDateInput(new Date().toISOString().slice(0, 19));
                setDateError(""); setDateResult(null);
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {dateError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {dateError}
            </div>
          )}

          {dateResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Unix (segundos)", value: dateResult.unix },
                { label: "Unix (milissegundos)", value: dateResult.ms },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                  <code className="text-sm font-mono flex-1">{value}</code>
                  <CopyButton text={value} size="icon" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </ToolLayout>
  );
}
