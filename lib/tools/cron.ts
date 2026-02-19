export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

function describeField(value: string, unit: string, names?: string[]): string {
  if (value === "*") return `todo(a) ${unit}`;
  if (value.startsWith("*/")) return `a cada ${value.slice(2)} ${unit}(s)`;
  if (value.includes("-")) {
    const [start, end] = value.split("-");
    const s = names ? names[parseInt(start)] : start;
    const e = names ? names[parseInt(end)] : end;
    return `de ${s} a ${e}`;
  }
  if (value.includes(",")) {
    const parts = value.split(",").map((v) => (names ? names[parseInt(v)] || v : v));
    return parts.join(", ");
  }
  if (names && !isNaN(parseInt(value))) return names[parseInt(value)] || value;
  return value;
}

export function describeCron(expression: string): { description: string; error?: string } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { description: "", error: "Expressão cron deve ter 5 partes: minuto hora dia mês dia-da-semana" };
  }

  const [minute, hour, dom, month, dow] = parts;

  try {
    const minuteDesc = describeField(minute, "minuto");
    const hourDesc = describeField(hour, "hora");
    const domDesc = describeField(dom, "dia do mês");
    const monthDesc = describeField(month, "mês", MONTHS);
    const dowDesc = describeField(dow, "dia da semana", DAYS);

    let desc = "Executa ";

    if (minute === "0" && hour === "0" && dom === "*" && month === "*" && dow === "*") {
      return { description: "Executa à meia-noite todos os dias" };
    }
    if (minute === "0" && hour === "*") desc += "a cada hora ";
    else if (minute === "0") desc += `às ${hour}h `;
    else desc += `aos ${minuteDesc} do ${hourDesc} `;

    if (dom !== "*") desc += `no ${domDesc} `;
    if (month !== "*") desc += `em ${monthDesc} `;
    if (dow !== "*") desc += `(${dowDesc}) `;

    return { description: desc.trim() };
  } catch (e) {
    return { description: "", error: "Expressão inválida: " + (e as Error).message };
  }
}

export function getNextExecutions(expression: string, count = 5): Date[] {
  // Simplified: returns approximate next execution times
  const results: Date[] = [];
  const now = new Date();
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return results;

  let current = new Date(now);
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);

  for (let i = 0; i < count * 100 && results.length < count; i++) {
    if (matchesCron(current, parts)) results.push(new Date(current));
    current = new Date(current.getTime() + 60000);
  }

  return results;
}

function matchesCron(date: Date, parts: string[]): boolean {
  const [minute, hour, dom, month, dow] = parts;
  return (
    matchField(date.getMinutes(), minute, 0, 59) &&
    matchField(date.getHours(), hour, 0, 23) &&
    matchField(date.getDate(), dom, 1, 31) &&
    matchField(date.getMonth() + 1, month, 1, 12) &&
    matchField(date.getDay(), dow, 0, 6)
  );
}

function matchField(value: number, field: string, min: number, max: number): boolean {
  if (field === "*") return true;
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2));
    return value % step === 0;
  }
  if (field.includes(",")) return field.split(",").map(Number).includes(value);
  if (field.includes("-")) {
    const [start, end] = field.split("-").map(Number);
    return value >= start && value <= end;
  }
  return parseInt(field) === value;
}
