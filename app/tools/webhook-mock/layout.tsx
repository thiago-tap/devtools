import type { Metadata } from "next";
import { metadataForTool } from "@/lib/seo";

export const metadata: Metadata = metadataForTool("webhook-mock");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
