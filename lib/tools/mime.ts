export interface MimeEntry {
  type: string;
  extensions: string[];
  description: string;
  category: string;
}

export const MIME_TYPES: MimeEntry[] = [
  // Texto
  { type: "text/plain", extensions: ["txt", "text"], description: "Texto simples", category: "Texto" },
  { type: "text/html", extensions: ["html", "htm"], description: "HTML", category: "Texto" },
  { type: "text/css", extensions: ["css"], description: "Folha de estilos CSS", category: "Texto" },
  { type: "text/javascript", extensions: ["js", "mjs"], description: "JavaScript", category: "Texto" },
  { type: "text/csv", extensions: ["csv"], description: "Valores separados por vírgula", category: "Texto" },
  { type: "text/xml", extensions: ["xml"], description: "XML (texto)", category: "Texto" },
  { type: "text/markdown", extensions: ["md", "markdown"], description: "Markdown", category: "Texto" },
  { type: "text/calendar", extensions: ["ics", "ical"], description: "Calendário iCalendar", category: "Texto" },
  { type: "text/yaml", extensions: ["yaml", "yml"], description: "YAML", category: "Texto" },

  // Aplicação
  { type: "application/json", extensions: ["json"], description: "JSON", category: "Aplicação" },
  { type: "application/ld+json", extensions: ["jsonld"], description: "JSON-LD", category: "Aplicação" },
  { type: "application/xml", extensions: ["xml"], description: "XML", category: "Aplicação" },
  { type: "application/pdf", extensions: ["pdf"], description: "PDF", category: "Aplicação" },
  { type: "application/zip", extensions: ["zip"], description: "Arquivo ZIP", category: "Aplicação" },
  { type: "application/gzip", extensions: ["gz", "gzip"], description: "Arquivo GZIP", category: "Aplicação" },
  { type: "application/x-tar", extensions: ["tar"], description: "Arquivo TAR", category: "Aplicação" },
  { type: "application/x-rar-compressed", extensions: ["rar"], description: "Arquivo RAR", category: "Aplicação" },
  { type: "application/x-7z-compressed", extensions: ["7z"], description: "Arquivo 7-Zip", category: "Aplicação" },
  { type: "application/octet-stream", extensions: ["bin", "exe", "dll"], description: "Dados binários genéricos", category: "Aplicação" },
  { type: "application/wasm", extensions: ["wasm"], description: "WebAssembly", category: "Aplicação" },
  { type: "application/x-www-form-urlencoded", extensions: [], description: "Form data (URL encoded)", category: "Aplicação" },
  { type: "application/x-sh", extensions: ["sh"], description: "Shell script", category: "Aplicação" },
  { type: "application/graphql", extensions: ["graphql", "gql"], description: "GraphQL", category: "Aplicação" },
  { type: "application/sql", extensions: ["sql"], description: "SQL", category: "Aplicação" },
  { type: "application/x-ndjson", extensions: ["ndjson"], description: "NDJSON (Newline Delimited JSON)", category: "Aplicação" },
  { type: "application/vnd.api+json", extensions: [], description: "JSON:API", category: "Aplicação" },

  // Office
  { type: "application/msword", extensions: ["doc"], description: "Word (legado)", category: "Office" },
  { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extensions: ["docx"], description: "Word (OOXML)", category: "Office" },
  { type: "application/vnd.ms-excel", extensions: ["xls"], description: "Excel (legado)", category: "Office" },
  { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extensions: ["xlsx"], description: "Excel (OOXML)", category: "Office" },
  { type: "application/vnd.ms-powerpoint", extensions: ["ppt"], description: "PowerPoint (legado)", category: "Office" },
  { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extensions: ["pptx"], description: "PowerPoint (OOXML)", category: "Office" },
  { type: "application/vnd.oasis.opendocument.text", extensions: ["odt"], description: "LibreOffice Writer", category: "Office" },
  { type: "application/vnd.oasis.opendocument.spreadsheet", extensions: ["ods"], description: "LibreOffice Calc", category: "Office" },

  // Imagem
  { type: "image/jpeg", extensions: ["jpg", "jpeg"], description: "Imagem JPEG", category: "Imagem" },
  { type: "image/png", extensions: ["png"], description: "Imagem PNG", category: "Imagem" },
  { type: "image/gif", extensions: ["gif"], description: "Imagem GIF", category: "Imagem" },
  { type: "image/webp", extensions: ["webp"], description: "Imagem WebP", category: "Imagem" },
  { type: "image/svg+xml", extensions: ["svg"], description: "Imagem SVG", category: "Imagem" },
  { type: "image/bmp", extensions: ["bmp"], description: "Imagem BMP", category: "Imagem" },
  { type: "image/tiff", extensions: ["tiff", "tif"], description: "Imagem TIFF", category: "Imagem" },
  { type: "image/avif", extensions: ["avif"], description: "Imagem AVIF", category: "Imagem" },
  { type: "image/x-icon", extensions: ["ico"], description: "Ícone", category: "Imagem" },

  // Áudio
  { type: "audio/mpeg", extensions: ["mp3"], description: "Áudio MP3", category: "Áudio" },
  { type: "audio/ogg", extensions: ["ogg", "oga"], description: "Áudio OGG", category: "Áudio" },
  { type: "audio/wav", extensions: ["wav"], description: "Áudio WAV", category: "Áudio" },
  { type: "audio/webm", extensions: ["weba"], description: "Áudio WebM", category: "Áudio" },
  { type: "audio/aac", extensions: ["aac"], description: "Áudio AAC", category: "Áudio" },
  { type: "audio/flac", extensions: ["flac"], description: "Áudio FLAC", category: "Áudio" },

  // Vídeo
  { type: "video/mp4", extensions: ["mp4", "m4v"], description: "Vídeo MP4", category: "Vídeo" },
  { type: "video/mpeg", extensions: ["mpeg", "mpg"], description: "Vídeo MPEG", category: "Vídeo" },
  { type: "video/ogg", extensions: ["ogv"], description: "Vídeo OGG", category: "Vídeo" },
  { type: "video/webm", extensions: ["webm"], description: "Vídeo WebM", category: "Vídeo" },
  { type: "video/x-msvideo", extensions: ["avi"], description: "Vídeo AVI", category: "Vídeo" },
  { type: "video/quicktime", extensions: ["mov", "qt"], description: "Vídeo QuickTime", category: "Vídeo" },
  { type: "video/x-matroska", extensions: ["mkv"], description: "Vídeo Matroska (MKV)", category: "Vídeo" },

  // Fonte
  { type: "font/ttf", extensions: ["ttf"], description: "Fonte TrueType", category: "Fonte" },
  { type: "font/otf", extensions: ["otf"], description: "Fonte OpenType", category: "Fonte" },
  { type: "font/woff", extensions: ["woff"], description: "Fonte WOFF", category: "Fonte" },
  { type: "font/woff2", extensions: ["woff2"], description: "Fonte WOFF2", category: "Fonte" },

  // Multipart
  { type: "multipart/form-data", extensions: [], description: "Form data (multipart)", category: "Multipart" },
  { type: "multipart/mixed", extensions: [], description: "Conteúdo misto", category: "Multipart" },
  { type: "multipart/byteranges", extensions: [], description: "Intervalos de bytes", category: "Multipart" },
];

export const MIME_CATEGORIES = [...new Set(MIME_TYPES.map((m) => m.category))];

export function searchMime(query: string): MimeEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return MIME_TYPES;
  return MIME_TYPES.filter(
    (m) =>
      m.type.toLowerCase().includes(q) ||
      m.extensions.some((e) => e.includes(q)) ||
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
  );
}
