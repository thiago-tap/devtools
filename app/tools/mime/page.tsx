"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/tools/copy-button";
import { Search } from "lucide-react";
import { searchMime, MIME_CATEGORIES } from "@/lib/tools/mime";

export default function MimePage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allResults = searchMime(query);
  const results = selectedCategory
    ? allResults.filter((m) => m.category === selectedCategory)
    : allResults;

  return (
    <ToolLayout title="MIME Types" description="Pesquise tipos MIME por extensão de arquivo ou content-type">
      <Panel title="Pesquisar">
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquise por extensão (jpg, pdf...) ou tipo (image/jpeg, application/...)"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todos ({allResults.length})
            </button>
            {MIME_CATEGORIES.map((cat) => {
              const count = allResults.filter((m) => m.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel title={`${results.length} tipo(s) encontrado(s)`}>
        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum tipo MIME encontrado para &quot;{query}&quot;.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Content-Type</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Extensões</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider hidden sm:table-cell">Descrição</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((mime) => (
                  <tr key={mime.type} className="border-b last:border-0 hover:bg-muted/30 group">
                    <td className="py-2 px-3">
                      <code className="text-xs font-mono text-blue-400 break-all">{mime.type}</code>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {mime.extensions.length > 0
                          ? mime.extensions.map((ext) => (
                              <Badge key={ext} variant="outline" className="font-mono text-[10px] px-1.5">
                                .{ext}
                              </Badge>
                            ))
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground hidden sm:table-cell">{mime.description}</td>
                    <td className="py-2 px-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton text={mime.type} size="icon" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </ToolLayout>
  );
}
