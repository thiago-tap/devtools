import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface ToolLayoutProps {
  title: string;
  description: string;
  hasAI?: boolean;
  children: ReactNode;
}

export function ToolLayout({ title, description, hasAI, children }: ToolLayoutProps) {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {hasAI && (
              <Badge variant="secondary" className="text-xs">
                AI
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

interface PanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Panel({ title, children, className = "", actions }: PanelProps) {
  return (
    <div className={`rounded-lg border bg-card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-2 border-b">
          {title && <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
