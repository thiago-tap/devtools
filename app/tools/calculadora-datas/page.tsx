"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { useQueryParamState } from "@/lib/hooks/use-query-param-state";
import { useToolHistory } from "@/lib/hooks/use-tool-history";
import {
  addDateDuration,
  calculateDateDifference,
  formatBrazilianDateTime,
  getBrazilianDateFacts,
  parseBrazilianDate,
  type DateDuration,
  type DateDifference,
} from "@/lib/tools/date-calculator";
import { AlertCircle, CalendarDays, RotateCcw } from "lucide-react";

type DateCalculatorHistory = {
  baseDate: string;
  days: string;
  weeks: string;
  months: string;
  years: string;
  targetDate: string;
  startDate: string;
  endDate: string;
};

function todayBr(): string {
  const now = new Date();
  return formatBrazilianDateTime(now).slice(0, 10);
}

function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatRelativeDays(diff: DateDifference): string {
  if (diff.direction === "same") return "hoje";
  if (diff.direction === "future") return `faltam ${diff.absoluteDays} dia(s)`;
  return `passaram ${diff.absoluteDays} dia(s)`;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
      <span className="text-xs text-muted-foreground w-40 shrink-0">{label}</span>
      <code className="text-xs font-mono flex-1 break-all">{value}</code>
      <CopyButton text={value} size="icon" />
    </div>
  );
}

function ErrorMessage({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

export default function CalculadoraDatasPage() {
  const [baseDate, setBaseDate] = useQueryParamState("base", todayBr());
  const [days, setDays] = useQueryParamState("days", "15");
  const [weeks, setWeeks] = useQueryParamState("weeks", "0");
  const [months, setMonths] = useQueryParamState("months", "0");
  const [years, setYears] = useQueryParamState("years", "0");
  const [targetDate, setTargetDate] = useQueryParamState("target", "17/07/2016");
  const [startDate, setStartDate] = useQueryParamState("start", todayBr());
  const [endDate, setEndDate] = useQueryParamState("end", "31/05/2026");
  const [today, setToday] = useState(() => new Date());
  const history = useToolHistory<DateCalculatorHistory>("calculadora-datas");

  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const baseParsed = useMemo(() => parseBrazilianDate(baseDate), [baseDate]);
  const duration = useMemo<DateDuration>(
    () => ({
      days: Number(days) || 0,
      weeks: Number(weeks) || 0,
      months: Number(months) || 0,
      years: Number(years) || 0,
    }),
    [days, weeks, months, years],
  );

  const addedDate = useMemo(() => {
    if (!baseParsed.ok || !baseParsed.date) return null;
    return addDateDuration(baseParsed.date, duration);
  }, [baseParsed, duration]);

  const targetParsed = useMemo(() => parseBrazilianDate(targetDate), [targetDate]);
  const todayToTarget = useMemo(() => {
    if (!targetParsed.ok || !targetParsed.date) return null;
    return calculateDateDifference(today, targetParsed.date);
  }, [targetParsed, today]);

  const startParsed = useMemo(() => parseBrazilianDate(startDate), [startDate]);
  const endParsed = useMemo(() => parseBrazilianDate(endDate), [endDate]);
  const rangeDiff = useMemo(() => {
    if (!startParsed.ok || !startParsed.date || !endParsed.ok || !endParsed.date) return null;
    return calculateDateDifference(startParsed.date, endParsed.date);
  }, [startParsed, endParsed]);

  const facts = addedDate ? getBrazilianDateFacts(addedDate) : null;
  const durationFields = [
    { label: "Dias", value: days, setValue: setDays },
    { label: "Semanas", value: weeks, setValue: setWeeks },
    { label: "Meses", value: months, setValue: setMonths },
    { label: "Anos", value: years, setValue: setYears },
  ];
  const saveHistory = () => {
    const value: DateCalculatorHistory = {
      baseDate,
      days,
      weeks,
      months,
      years,
      targetDate,
      startDate,
      endDate,
    };

    history.add("cálculo de datas", value);
  };
  const restoreHistory = (value: DateCalculatorHistory) => {
    setBaseDate(value.baseDate);
    setDays(value.days);
    setWeeks(value.weeks);
    setMonths(value.months);
    setYears(value.years);
    setTargetDate(value.targetDate);
    setStartDate(value.startDate);
    setEndDate(value.endDate);
  };

  return (
    <ToolLayout
      title="Calculadora de Datas"
      description="Some dias, semanas, meses e anos; calcule diferenças e prazos no formato brasileiro."
    >
      <Panel
        title="Somar ou subtrair prazo"
        actions={<Button size="sm" variant="outline" onClick={saveHistory}>Guardar</Button>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Data base (DD/MM/AAAA ou DD/MM/AAAA HH:mm)</label>
              <Input value={baseDate} onChange={(e) => setBaseDate(e.target.value)} className="font-mono" />
            </div>
            {durationFields.map(({ label, value, setValue }) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground">{label}</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="font-mono"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setBaseDate(todayBr());
                setDays("15");
                setWeeks("0");
                setMonths("0");
                setYears("0");
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Hoje + 15 dias
            </Button>
          </div>

          {!baseParsed.ok && <ErrorMessage>{baseParsed.error ?? "Data inválida."}</ErrorMessage>}

          {addedDate && facts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ResultRow label="Resultado" value={facts.dateTime} />
              <ResultRow label="Dia da semana" value={facts.weekday} />
              <ResultRow label="Por extenso" value={facts.longDate} />
              <ResultRow label="ISO" value={facts.iso} />
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Hoje até uma data">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              placeholder="17/07/2016"
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const now = new Date();
                setToday(now);
                setTargetDate(formatBrazilianDateTime(now).slice(0, 10));
              }}
            >
              <CalendarDays className="h-4 w-4" />
              Usar hoje
            </Button>
          </div>
          {!targetParsed.ok && <ErrorMessage>{targetParsed.error ?? "Data inválida."}</ErrorMessage>}
          {todayToTarget && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ResultRow
                label="Diferença"
                value={formatRelativeDays(todayToTarget)}
              />
              <ResultRow
                label="Semanas"
                value={`${todayToTarget.completeWeeks} semana(s) e ${todayToTarget.remainingDaysAfterWeeks} dia(s)`}
              />
              <ResultRow
                label="Aprox. meses"
                value={`${formatNumber(todayToTarget.approximateMonths)} mês(es)`}
              />
              <ResultRow
                label="Aprox. anos"
                value={`${formatNumber(todayToTarget.approximateYears)} ano(s)`}
              />
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Diferença entre duas datas">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Data inicial</label>
              <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} className="font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Data final</label>
              <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} className="font-mono" />
            </div>
          </div>
          {!startParsed.ok && <ErrorMessage>{startParsed.error ?? "Data inicial inválida."}</ErrorMessage>}
          {!endParsed.ok && <ErrorMessage>{endParsed.error ?? "Data final inválida."}</ErrorMessage>}
          {rangeDiff && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ResultRow label="Dias totais" value={`${rangeDiff.totalDays} dia(s)`} />
              <ResultRow
                label="Semanas"
                value={`${rangeDiff.completeWeeks} semana(s) e ${rangeDiff.remainingDaysAfterWeeks} dia(s)`}
              />
              <ResultRow
                label="Calendário"
                value={`${rangeDiff.calendar.years} ano(s), ${rangeDiff.calendar.months} mês(es), ${rangeDiff.calendar.days} dia(s)`}
              />
              <ResultRow
                label="Aproximação"
                value={`${formatNumber(rangeDiff.approximateYears)} ano(s) / ${formatNumber(rangeDiff.approximateMonths)} mês(es)`}
              />
            </div>
          )}
        </div>
      </Panel>
      {history.items.length > 0 && (
        <Panel title="Histórico local" actions={<Button size="sm" variant="outline" onClick={history.clear}>Limpar</Button>}>
          <div className="space-y-2">
            {history.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full rounded border p-2 text-left hover:bg-muted/40"
                onClick={() => restoreHistory(item.value)}
              >
                <code className="text-xs">
                  {item.value.baseDate} + {item.value.days}d / {item.value.startDate} até {item.value.endDate}
                </code>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
