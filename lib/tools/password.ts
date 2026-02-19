export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const CHARS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  uppercaseClean: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  lowercaseClean: "abcdefghjkmnpqrstuvwxyz",
  numbers: "0123456789",
  numbersClean: "23456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export function generatePassword(opts: PasswordOptions): string {
  let charset = "";
  if (opts.uppercase) charset += opts.excludeAmbiguous ? CHARS.uppercaseClean : CHARS.uppercase;
  if (opts.lowercase) charset += opts.excludeAmbiguous ? CHARS.lowercaseClean : CHARS.lowercase;
  if (opts.numbers) charset += opts.excludeAmbiguous ? CHARS.numbersClean : CHARS.numbers;
  if (opts.symbols) charset += CHARS.symbols;

  if (!charset) return "";

  const array = new Uint32Array(opts.length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => charset[x % charset.length]).join("");
}

export function scorePassword(password: string): {
  score: number;
  label: string;
  color: string;
  tips: string[];
} {
  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score += 1; else tips.push("Use pelo menos 8 caracteres");
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password)) score += 1; else tips.push("Adicione letras maiúsculas");
  if (/[a-z]/.test(password)) score += 1; else tips.push("Adicione letras minúsculas");
  if (/[0-9]/.test(password)) score += 1; else tips.push("Adicione números");
  if (/[^A-Za-z0-9]/.test(password)) score += 1; else tips.push("Adicione símbolos especiais");

  const labels = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte", "Muito forte"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#10b981"];

  const idx = Math.min(Math.floor(score / 1.2), 5);
  return { score, label: labels[idx], color: colors[idx], tips };
}
