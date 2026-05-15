import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools";

const APP_NAME = "DevToolbox";
const APP_URL = "https://devtools.catiteo.com";

export function metadataForTool(toolId: string): Metadata {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    return { title: APP_NAME };
  }

  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.tags,
    alternates: { canonical: `${APP_URL}${tool.href}` },
    openGraph: {
      title: `${tool.name} | ${APP_NAME}`,
      description: tool.description,
      url: `${APP_URL}${tool.href}`,
    },
  };
}
