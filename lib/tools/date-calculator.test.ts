import { describe, expect, it } from "vitest";
import {
  addDateDuration,
  calculateDateDifference,
  daysBetweenBrazilianDates,
  formatBrazilianDateTime,
  parseBrazilianDate,
} from "./date-calculator";

describe("date-calculator", () => {
  it("parseia datas brasileiras com e sem hora", () => {
    expect(parseBrazilianDate("17/07/2016").date?.getFullYear()).toBe(2016);
    expect(parseBrazilianDate("17/07/2016").date?.getMonth()).toBe(6);
    expect(parseBrazilianDate("17/07/2016").date?.getDate()).toBe(17);

    const parsed = parseBrazilianDate("05/01/2026 09:30");
    expect(parsed.ok).toBe(true);
    expect(parsed.hasTime).toBe(true);
    expect(parsed.date?.getHours()).toBe(9);
    expect(parsed.date?.getMinutes()).toBe(30);
  });

  it("rejeita datas brasileiras inválidas", () => {
    expect(parseBrazilianDate("31/02/2024").ok).toBe(false);
    expect(parseBrazilianDate("2024-02-01").ok).toBe(false);
    expect(parseBrazilianDate("01/13/2024").ok).toBe(false);
    expect(parseBrazilianDate("01/01/2025 24:00").ok).toBe(false);
  });

  it("soma dias, semanas, meses e anos preservando fim de mês quando necessário", () => {
    const start = parseBrazilianDate("31/01/2024").date!;
    const result = addDateDuration(start, { months: 1, days: 15 });

    expect(formatBrazilianDateTime(result)).toBe("15/03/2024 00:00");

    const plus = addDateDuration(parseBrazilianDate("16/05/2026").date!, { days: 15 });
    expect(formatBrazilianDateTime(plus)).toBe("31/05/2026 00:00");

    const minus = addDateDuration(parseBrazilianDate("16/05/2026").date!, { days: -5 });
    expect(formatBrazilianDateTime(minus)).toBe("11/05/2026 00:00");
  });

  it("calcula diferença total e decomposição calendário", () => {
    const start = parseBrazilianDate("17/07/2016").date!;
    const end = parseBrazilianDate("16/05/2026").date!;
    const diff = calculateDateDifference(start, end);

    expect(diff.totalDays).toBe(3590);
    expect(diff.calendar).toEqual({ years: 9, months: 9, days: 29 });
    expect(diff.completeWeeks).toBe(512);
    expect(diff.remainingDaysAfterWeeks).toBe(6);
  });

  it("calcula dias entre strings brasileiras", () => {
    const forward = daysBetweenBrazilianDates("16/05/2026", "31/05/2026");
    expect(forward.ok).toBe(true);
    if (forward.ok) expect(forward.days).toBe(15);

    const backward = daysBetweenBrazilianDates("31/05/2026", "16/05/2026");
    expect(backward.ok).toBe(true);
    if (backward.ok) expect(backward.days).toBe(-15);
  });
});
