"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Binary, Braces, Bot, Clock, Database, FileText, FileType, Fingerprint,
  GitCompare, Globe, Hash, KeyRound, Palette, Regex, Server, ShieldCheck,
  Timer, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/lib/tools";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { ToolCategory } from "@/types";

const ICONS: Record<string, React.ElementType> = {
  Binary, Braces, Bot, Clock, Database, FileText, FileType,
  Fingerprint, GitCompare, Globe, Hash, KeyRound, Palette,
  Regex, Server, ShieldCheck, Timer,
};

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  JSON: "JSON",
  Code: "Código",
  Text: "Texto",
  Encoding: "Codificação",
  Security: "Segurança",
  Colors: "Cores",
  Database: "Banco de Dados",
  Utilities: "Utilitários",
  Network: "Rede",
};

const CATEGORY_ORDER: ToolCategory[] = ["JSON", "Code", "Text", "Encoding", "Security", "Colors", "Database", "Utilities", "Network"];

export function Sidebar() {
  const pathname = usePathname();

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const tools = TOOLS.filter((t) => t.category === cat);
    if (tools.length) acc[cat] = tools;
    return acc;
  }, {} as Record<string, typeof TOOLS>);

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col border-r bg-card/50 h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">DevToolbox</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-1 p-3 space-y-5">
        {Object.entries(grouped).map(([category, tools]) => (
          <div key={category}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
              {CATEGORY_LABELS[category as ToolCategory] ?? category}
            </p>
            <ul className="space-y-0.5">
              {tools.map((tool) => {
                const Icon = ICONS[tool.icon] ?? Wrench;
                const isActive = pathname === tool.href;
                return (
                  <li key={tool.id}>
                    <Link
                      href={tool.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tool.name}</span>
                      {tool.isNew && (
                        <span className="ml-auto text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                          NOVO
                        </span>
                      )}
                      {tool.hasAI && !tool.isNew && (
                        <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">
                          IA
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t">
        <p className="text-[10px] text-muted-foreground text-center">
          devtools.catiteo.com
        </p>
      </div>
    </aside>
  );
}
