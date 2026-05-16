export interface ParsedBrazilianDate {
  ok: boolean;
  date?: Date;
  hasTime?: boolean;
  error?: string;
}

export interface DateDuration {
  days?: number;
  weeks?: number;
  months?: number;
  years?: number;
}

export interface CalendarDifference {
  years: number;
  months: number;
  days: number;
}

export interface DateDifference {
  totalDays: number;
  absoluteDays: number;
  direction: "past" | "future" | "same";
  completeWeeks: number;
  remainingDaysAfterWeeks: number;
  approximateMonths: number;
  approximateYears: number;
  calendar: CalendarDifference;
}

export interface BrazilianDateFacts {
  date: string;
  dateTime: string;
  weekday: string;
  longDate: string;
  iso: string;
}

const BR_DATE_RE =
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;

function isSameLocalDateParts(
  date: Date,
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
): boolean {
  return (
    date.getFullYear() === year &&
    date.getMonth() === monthIndex &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute
  );
}

function utcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonthsClamped(date: Date, months: number): Date {
  const targetMonth = date.getMonth() + months;
  const first = new Date(date);
  first.setDate(1);
  first.setMonth(targetMonth);
  const day = Math.min(date.getDate(), daysInMonth(first.getFullYear(), first.getMonth()));
  first.setDate(day);
  return first;
}

function isAfterDateOnly(a: Date, b: Date): boolean {
  return utcDayNumber(a) > utcDayNumber(b);
}

export function parseBrazilianDate(input: string): ParsedBrazilianDate {
  const trimmed = input.trim();
  const match = BR_DATE_RE.exec(trimmed);
  if (!match) {
    return { ok: false, error: "Use o formato DD/MM/AAAA ou DD/MM/AAAA HH:mm." };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hasTime = match[4] !== undefined;
  const hour = hasTime ? Number(match[4]) : 0;
  const minute = hasTime ? Number(match[5]) : 0;

  if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) {
    return { ok: false, error: "Data ou hora fora do intervalo válido." };
  }

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (!isSameLocalDateParts(date, year, month - 1, day, hour, minute)) {
    return { ok: false, error: "Data inválida." };
  }

  return { ok: true, date, hasTime };
}

export function formatBrazilianDateTime(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear()).padStart(4, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function formatBrazilianDate(date: Date): string {
  return formatBrazilianDateTime(date).slice(0, 10);
}

export function addDateDuration(date: Date, duration: DateDuration): Date {
  let result = new Date(date);
  const years = duration.years ?? 0;
  const months = duration.months ?? 0;
  const weeks = duration.weeks ?? 0;
  const days = duration.days ?? 0;

  if (years) result = addMonthsClamped(result, years * 12);
  if (months) result = addMonthsClamped(result, months);
  if (weeks || days) result.setDate(result.getDate() + weeks * 7 + days);

  return result;
}

export function calculateDateDifference(start: Date, end: Date): DateDifference {
  const totalDays = utcDayNumber(end) - utcDayNumber(start);
  const absoluteDays = Math.abs(totalDays);
  const direction = totalDays === 0 ? "same" : totalDays > 0 ? "future" : "past";
  const earlier = totalDays <= 0 ? end : start;
  const later = totalDays <= 0 ? start : end;

  const calendar = calculateCalendarDifference(earlier, later);

  return {
    totalDays,
    absoluteDays,
    direction,
    completeWeeks: Math.floor(absoluteDays / 7),
    remainingDaysAfterWeeks: absoluteDays % 7,
    approximateMonths: absoluteDays / 30.436875,
    approximateYears: absoluteDays / 365.2425,
    calendar,
  };
}

export function calculateCalendarDifference(start: Date, end: Date): CalendarDifference {
  let cursor = new Date(start);
  let years = 0;
  let months = 0;

  let nextYear = addDateDuration(cursor, { years: 1 });
  while (!isAfterDateOnly(nextYear, end)) {
    cursor = nextYear;
    years += 1;
    nextYear = addDateDuration(cursor, { years: 1 });
  }

  let nextMonth = addDateDuration(cursor, { months: 1 });
  while (!isAfterDateOnly(nextMonth, end)) {
    cursor = nextMonth;
    months += 1;
    nextMonth = addDateDuration(cursor, { months: 1 });
  }

  const days = utcDayNumber(end) - utcDayNumber(cursor);
  return { years, months, days };
}

export function daysBetweenBrazilianDates(
  startInput: string,
  endInput: string,
): { ok: true; days: number } | { ok: false; error: string } {
  const start = parseBrazilianDate(startInput);
  if (!start.ok || !start.date) return { ok: false, error: start.error ?? "Data inicial inválida." };

  const end = parseBrazilianDate(endInput);
  if (!end.ok || !end.date) return { ok: false, error: end.error ?? "Data final inválida." };

  return { ok: true, days: calculateDateDifference(start.date, end.date).totalDays };
}

export function getBrazilianDateFacts(date: Date): BrazilianDateFacts {
  return {
    date: formatBrazilianDate(date),
    dateTime: formatBrazilianDateTime(date),
    weekday: date.toLocaleDateString("pt-BR", { weekday: "long" }),
    longDate: date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    iso: date.toISOString(),
  };
}
