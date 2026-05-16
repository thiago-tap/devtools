import type { Metadata } from "next";
import { metadataForTool } from "@/lib/seo";

export const metadata: Metadata = metadataForTool("openapi");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
