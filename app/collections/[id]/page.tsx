import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOOL_COLLECTIONS, TOOLS } from "@/lib/tools";

type Tool = (typeof TOOLS)[number];

export function generateStaticParams(): Array<{ id: string }> {
  return TOOL_COLLECTIONS.map((collection) => ({ id: collection.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const collection = TOOL_COLLECTIONS.find((item) => item.id === id);
  return {
    title: collection ? `${collection.name} | DevToolbox` : "Coleção | DevToolbox",
    description: collection?.description,
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = TOOL_COLLECTIONS.find((item) => item.id === id);
  if (!collection) notFound();

  const tools = collection.toolIds
    .map((toolId) => TOOLS.find((tool) => tool.id === toolId))
    .filter((tool): tool is Tool => Boolean(tool));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Coleção</p>
      <h1 className="text-3xl font-bold">{collection.name}</h1>
      <p className="text-muted-foreground mt-2">{collection.description}</p>
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
