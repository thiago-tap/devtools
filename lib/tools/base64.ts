export function encodeBase64(input: string): string {
  try {
    return btoa(unescape(encodeURIComponent(input)));
  } catch {
    return btoa(input);
  }
}

export function decodeBase64(input: string): { result: string; error?: string } {
  try {
    return { result: decodeURIComponent(escape(atob(input.trim()))) };
  } catch (e) {
    return { result: "", error: "Base64 inválido: " + (e as Error).message };
  }
}

export function encodeURL(input: string): string {
  return encodeURIComponent(input);
}

export function decodeURL(input: string): { result: string; error?: string } {
  try {
    return { result: decodeURIComponent(input) };
  } catch (e) {
    return { result: "", error: "URL encoding inválido: " + (e as Error).message };
  }
}

export function encodeHTML(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function decodeHTML(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
