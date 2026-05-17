import { ToolsExplorer } from "@/components/home/tools-explorer";
import { WorkspacePanel } from "@/components/workspace/workspace-panel";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <WorkspacePanel />
      <ToolsExplorer toolCount={TOOLS.length} />
    </div>
  );
}
