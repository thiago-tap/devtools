import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import type { ToolCategory } from "@/types";

const LABELS: Record<ToolCategory, string> = {
  JSON: "JSON",
  Code: "Código",
  Text: "Texto",
  Encoding: "Codificação",
  Colors: "Cores",
  Images: "Imagens",
  Security: "Segurança",
  Database: "Banco de Dados",
  Utilities: "Utilitários",
  Network: "Rede",
};

function slugCategory(category: string): string {
  return category.toLowerCase();
}

export function generateStaticParams(): Array<{ category: string }> {
  return CATEGORIES.map((category) => ({ category: slugCategory(category) }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: categoryParam } = await params;
  const category = CATEGORIES.find((item) => slugCategory(item) === categoryParam);
  return {
    title: category ? `${LABELS[category]} | DevToolbox` : "Categoria | DevToolbox",
    description: category ? `Ferramentas de ${LABELS[category]} para desenvolvimento.` : undefined,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryParam } = await params;
  const category = CATEGORIES.find((item) => slugCategory(item) === categoryParam);
  if (!category) notFound();

  const tools = TOOLS.filter((tool) => tool.category === category);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Categoria</p>
      <h1 className="text-3xl font-bold">{LABELS[category]}</h1>
      <p className="text-muted-foreground mt-2">Ferramentas de {LABELS[category]} disponíveis no DevToolbox.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
        {tools.map((tool) => (
          <Link key={tool.id} href={tool.href} className="rounded-lg border bg-card p-4 hover:bg-accent/40">
            <h2 className="font-semibold">{tool.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
