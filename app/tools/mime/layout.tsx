import type { Metadata } from "next";
import { metadataForTool } from "@/lib/seo";

export const metadata: Metadata = metadataForTool("mime");

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
