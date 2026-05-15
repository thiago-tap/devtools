"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Binary,
  Braces,
  Bot,
  Calculator,
  Clock,
  Database,
  FileCode2,
  FileText,
  FileType,
  Fingerprint,
  GitCompare,
  Globe,
  Hash,
  Key,
  KeyRound,
  Palette,
  Regex,
  Search,
  Server,
  ShieldCheck,
  Shirt,
  Star,
  Timer,
  Variable,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TOOLS, CATEGORIES, searchTools } from "@/lib/tools";
import { useFavorites } from "@/lib/hooks/use-favorites";
import type { ToolCategory } from "@/types";

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  JSON: "JSON",
  Code: "Código",
  Text: "Texto",
  Encoding: "Codificação",
  Security: "Segurança",
  Colors: "Cores",
  Images: "Imagens",
  Database: "Banco de Dados",
  Utilities: "Utilitários",
  Network: "Rede",
};

const ICONS: Record<string, React.ElementType> = {
  Binary,
  Braces,
  Bot,
  Calculator,
  Clock,
  Database,
  FileCode2,
  FileText,
  FileType,
  Fingerprint,
  GitCompare,
  Globe,
  Hash,
  Key,
  KeyRound,
  Palette,
  Regex,
  Server,
  ShieldCheck,
  Shirt,
  Timer,
  Variable,
};

interface ToolsExplorerProps {
  toolCount: number;
}

export function ToolsExplorer({ toolCount }: ToolsExplorerProps) {
  const [query, setQuery] = useState("");
  const { favorites, loaded, toggle, isFavorite } = useFavorites();

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return TOOLS;
    return searchTools(q);
  }, [query]);

  const favoriteTools = useMemo(
    () => TOOLS.filter((t) => favorites.includes(t.id)),
    [favorites]
  );

  const categoriesToShow = useMemo(() => {
    if (query.trim()) return [...new Set(filtered.map((t) => t.category))];
    return [...CATEGORIES];
  }, [query, filtered]);

  return (
    <>
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-4 py-1.5 rounded-full text-sm text-primary font-medium">
          <Wrench className="h-4 w-4" />
          {toolCount} ferramentas disponíveis
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">DevToolbox</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Todas as ferramentas que você precisa no dia a dia como desenvolvedor.
          Rápido, gratuito e com AI integrada.
        </p>
      </div>

      <div className="relative max-w-md mx-auto mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ferramentas..."
          className="pl-9"
        />
      </div>

      {loaded && favoriteTools.length > 0 && !query.trim() && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Favoritos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {favoriteTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={isFavorite(tool.id)}
                onToggleFavorite={() => toggle(tool.id)}
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma ferramenta encontrada para &quot;{query}&quot;.
        </p>
      ) : (
        categoriesToShow.map((category) => {
          const tools = filtered.filter((t) => t.category === category);
          if (!tools.length) return null;
          return (
            <div key={category} className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {CATEGORY_LABELS[category as ToolCategory] ?? category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {tools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isFavorite={isFavorite(tool.id)}
                    onToggleFavorite={() => toggle(tool.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

function ToolCard({
  tool,
  isFavorite,
  onToggleFavorite,
}: {
  tool: (typeof TOOLS)[number];
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const Icon = ICONS[tool.icon] ?? Wrench;

  return (
    <div className="group relative flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all h-full">
      <div className="flex items-start justify-between">
        <Link href={tool.href} className="p-2 rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </Link>
        <div className="flex gap-1 items-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite();
            }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-amber-400 transition-colors"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star
              className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
            />
          </button>
          {tool.isNew && <Badge variant="success" className="text-[10px] px-1.5">NEW</Badge>}
          {tool.hasAI && <Badge variant="secondary" className="text-[10px] px-1.5">AI</Badge>}
        </div>
      </div>
      <Link href={tool.href} className="flex-1">
        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {tool.description}
        </p>
      </Link>
    </div>
  );
}
