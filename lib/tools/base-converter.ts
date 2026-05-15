export type BaseRadix = 2 | 8 | 10 | 16;

const DIGITS = "0123456789ABCDEF";

export function convertBase(
  value: string,
  from: BaseRadix,
  to: BaseRadix
): { result: string; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { result: "" };

  try {
    if (from === 10) {
      const n = BigInt(trimmed);
      return { result: fromBigInt(n, to) };
    }

    const normalized =
      from === 16 ? trimmed.replace(/^0x/i, "") : trimmed;

    if (!isValidForBase(normalized, from)) {
      return { result: "", error: `Valor inválido para base ${from}` };
    }

    const prefixed =
      from === 16 ? `0x${normalized}` : from === 8 ? `0o${normalized}` : `0b${normalized}`;
    const n = BigInt(prefixed);
    return { result: fromBigInt(n, to) };
  } catch {
    return { result: "", error: "Número inválido ou fora do limite" };
  }
}

function isValidForBase(value: string, base: BaseRadix): boolean {
  const pattern =
    base === 2 ? /^[01]+$/ : base === 8 ? /^[0-7]+$/ : base === 16 ? /^[0-9a-fA-F]+$/ : /^\d+$/;
  return pattern.test(value);
}

function fromBigInt(n: bigint, to: BaseRadix): string {
  if (n === 0n) return "0";
  if (to === 10) return n.toString(10);

  const base = BigInt(to);
  let x = n < 0n ? -n : n;
  let out = "";

  while (x > 0n) {
    const rem = Number(x % base);
    out = DIGITS[rem]! + out;
    x /= base;
  }

  const prefix = to === 16 ? "0x" : to === 8 ? "0o" : to === 2 ? "0b" : "";
  return (n < 0n ? "-" : "") + prefix + out;
}

export function convertToAllBases(value: string, from: BaseRadix): Record<BaseRadix, string> | { error: string } {
  const r2 = convertBase(value, from, 2);
  if (r2.error) return { error: r2.error };
  const r8 = convertBase(value, from, 8);
  const r10 = convertBase(value, from, 10);
  const r16 = convertBase(value, from, 16);
  return {
    2: r2.result,
    8: r8.result,
    10: r10.result,
    16: r16.result,
  };
}
