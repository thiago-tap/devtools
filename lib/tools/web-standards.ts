export function generateRobotsTxt(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}

export function generateSitemapXml(urls: string[]): string {
  const entries = urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url.trim())}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function generateSecurityTxt(contact: string, expires: string): string {
  return `Contact: ${contact}\nExpires: ${expires}\nPreferred-Languages: pt-BR, en\nCanonical: /.well-known/security.txt\n`;
}

export function recommendedSecurityHeaders(): string {
  return [
    "Content-Security-Policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'",
    "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy: camera=(), microphone=(), geolocation=()",
  ].join("\n");
}
