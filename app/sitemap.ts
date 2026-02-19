import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

const APP_URL = "https://devtools.catiteo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = TOOLS.map((tool) => ({
    url: `${APP_URL}${tool.href}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...toolPages,
  ];
}
