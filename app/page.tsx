import { ToolsExplorer } from "@/components/home/tools-explorer";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToolsExplorer toolCount={TOOLS.length} />
    </div>
  );
}
