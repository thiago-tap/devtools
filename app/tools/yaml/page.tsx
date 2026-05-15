"use client";

import dynamic from "next/dynamic";

const YamlTool = dynamic(() => import("./yaml-tool"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-sm text-muted-foreground">Carregando conversor YAML...</div>
  ),
});

export default function YamlPage() {
  return <YamlTool />;
}
