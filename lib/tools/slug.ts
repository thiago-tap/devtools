const NON_SLUG = /[^a-z0-9]+/g;

/** Gera slug tipo URL (minúsculas, hífens, sem acentos básicos). */
export function slugify(input: string, maxLen = 120): string {
  const s = input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(NON_SLUG, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return s || "item";
}
