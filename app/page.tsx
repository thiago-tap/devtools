import Link from "next/link";
import {
  Binary, Braces, Bot, Clock, Database, FileText, Fingerprint,
  GitCompare, Hash, KeyRound, Palette, Regex, ShieldCheck, Wrench, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TOOLS, CATEGORIES } from "@/lib/tools";

const ICONS: Record<string, React.ElementType> = {
  Binary, Braces, Bot, Clock, Database, FileText,
  Fingerprint, GitCompare, Hash, KeyRound, Palette,
  Regex, ShieldCheck,
};

export default function Home() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-4 py-1.5 rounded-full text-sm text-primary font-medium">
          <Wrench className="h-4 w-4" />
          {TOOLS.length} ferramentas disponíveis
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          DevToolbox
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Todas as ferramentas que você precisa no dia a dia como desenvolvedor.
          Rápido, gratuito e com AI integrada.
        </p>
      </div>

      {/* Tools Grid by Category */}
      {CATEGORIES.map((category) => {
        const tools = TOOLS.filter((t) => t.category === category);
        return (
          <div key={category} className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tools.map((tool) => {
                const Icon = ICONS[tool.icon] ?? Wrench;
                return (
                  <Link key={tool.id} href={tool.href}>
                    <div className="group relative flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer h-full">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex gap-1">
                          {tool.isNew && <Badge variant="success" className="text-[10px] px-1.5">NEW</Badge>}
                          {tool.hasAI && <Badge variant="secondary" className="text-[10px] px-1.5">AI</Badge>}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
