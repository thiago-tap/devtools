import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

const APP_URL = "https://devtools.catiteo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = TOOLS.map((tool) => ({
    url: `${APP_URL}${tool.href}`,
    lastModified: new Date(),
    changeFrequency: tool.isNew ? "weekly" as const : "monthly" as const,
    priority: tool.isNew ? 0.85 : 0.8,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...toolPages,
  ];
}
