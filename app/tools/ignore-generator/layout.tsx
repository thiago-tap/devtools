import type { Metadata } from "next";
import { metadataForTool } from "@/lib/seo";

export const metadata: Metadata = metadataForTool("ignore-generator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
