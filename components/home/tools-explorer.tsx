"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Binary,
  Braces,
  Bot,
  Calculator,
  CalendarDays,
  Clock,
  Database,
  FileCode2,
  FileKey,
  FileText,
  FileType,
  Filter,
  Fingerprint,
  GitCompare,
  Globe,
  Hash,
  ImageDown,
  Key,
  KeyRound,
  Library,
  Link2,
  Package,
  Palette,
  QrCode,
  Regex,
  Route,
  Search,
  Server,
  ShieldCheck,
  ShieldHalf,
  Shirt,
  Tags,
  Star,
  Timer,
  Variable,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TOOLS, CATEGORIES, TOOL_COLLECTIONS, searchTools } from "@/lib/tools";
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
  CalendarDays,
  Clock,
  Database,
  FileCode2,
  FileKey,
  FileText,
  FileType,
  Filter,
  Fingerprint,
  GitCompare,
  Globe,
  Hash,
  ImageDown,
  Key,
  KeyRound,
  Library,
  Link2,
  Package,
  Palette,
  QrCode,
  Regex,
  Route,
  Server,
  ShieldCheck,
  ShieldHalf,
  Shirt,
  Tags,
  Timer,
  Variable,
};

interface ToolsExplorerProps {
  toolCount: number;
}

const NEWS_MAX_AGE_DAYS = 55;

function isNewsTool(t: (typeof TOOLS)[number]): boolean {
  if (!t.addedAt) return false;
  const t0 = new Date(t.addedAt).getTime();
  if (Number.isNaN(t0)) return false;
  const days = (Date.now() - t0) / 86_400_000;
  return days >= 0 && days <= NEWS_MAX_AGE_DAYS;
}

export function ToolsExplorer({ toolCount }: ToolsExplorerProps) {
  const [query, setQuery] = useState("");
  const { favorites, loaded, toggle, isFavorite } = useFavorites();

  const newsTools = useMemo(() => TOOLS.filter(isNewsTool), []);
  const newsIds = useMemo(() => new Set(newsTools.map((t) => t.id)), [newsTools]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return TOOLS;
    return searchTools(q);
  }, [query]);

  const favoriteTools = useMemo(
    () => TOOLS.filter((t) => favorites.includes(t.id)),
    [favorites]
  );
  const collections = useMemo(
    () =>
      TOOL_COLLECTIONS.map((collection) => ({
        ...collection,
        tools: collection.toolIds
          .map((id) => TOOLS.find((tool) => tool.id === id))
          .filter((tool): tool is (typeof TOOLS)[number] => Boolean(tool)),
      })),
    [],
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

      {loaded && newsTools.length > 0 && !query.trim() && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Novidades
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {newsTools.map((tool) => (
              <ToolCard
                key={`news-${tool.id}`}
                tool={tool}
                isFavorite={isFavorite(tool.id)}
                onToggleFavorite={() => toggle(tool.id)}
              />
            ))}
          </div>
        </div>
      )}

      {loaded && favoriteTools.length > 0 && !query.trim() && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Fixados
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

      {!query.trim() && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Coleções
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {collections.map((collection) => (
              <div key={collection.id} className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold text-sm">{collection.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{collection.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {collection.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
                <Link href={`/collections/${collection.id}`} className="text-xs text-primary hover:underline mt-3 inline-block">
                  Ver coleção completa
                </Link>
              </div>
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
          const tools = filtered
            .filter((t) => t.category === category)
            .filter((t) => query.trim() || !newsIds.has(t.id));
          if (!tools.length) return null;
          return (
            <div key={category} className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                <Link href={`/tools/categoria/${String(category).toLowerCase()}`} className="hover:text-foreground">
                  {CATEGORY_LABELS[category as ToolCategory] ?? category}
                </Link>
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
