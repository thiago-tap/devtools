export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  href: string;
  icon: string;
  tags: string[];
  isNew?: boolean;
  hasAI?: boolean;
}

export type ToolCategory =
  | "JSON"
  | "Code"
  | "Text"
  | "Encoding"
  | "Colors"
  | "Security"
  | "Database"
  | "Utilities"
  | "Network";

export interface AIResponse {
  result: string;
  error?: string;
}

export interface JWTPayload {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  isExpired: boolean;
  expiresAt?: Date;
}

export interface DiffResult {
  type: "added" | "removed" | "unchanged";
  value: string;
}

export interface ColorFormats {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
  cmyk: { c: number; m: number; y: number; k: number };
}

export interface RegexMatch {
  match: string;
  index: number;
  groups: Record<string, string> | null;
}
