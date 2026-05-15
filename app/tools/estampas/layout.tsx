import type { Metadata } from "next";
import { metadataForTool } from "@/lib/seo";

export const metadata: Metadata = metadataForTool("estampas");

export default function EstampasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
