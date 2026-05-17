"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Boxes, Clock, QrCode, Server } from "lucide-react";
import { emptyWorkspace, loadWorkspace, type RestWorkspace } from "@/lib/storage/workspaces";

function countRequests(workspace: RestWorkspace): number {
  return workspace.collections.reduce((total, collection) => total + collection.requests.length, 0);
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

export function WorkspacePanel() {
  const [workspace, setWorkspace] = useState<RestWorkspace>(emptyWorkspace);

  useEffect(() => {
    setWorkspace(loadWorkspace());
  }, []);

  const stats = useMemo(() => {
    return {
      collections: workspace.collections.length,
      requests: countRequests(workspace),
      qrCodes: workspace.qrCodes.length,
      recentItems: workspace.recentItems.length,
    };
  }, [workspace]);

  return (
    <section className="mb-10 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workspace local</p>
          <h2 className="mt-1 text-xl font-semibold">Seu painel de trabalho neste navegador</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Requests, QR Codes e recentes ficam salvos localmente, sem conta e sem banco.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tools/rest-client" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">
            Abrir REST Client
          </Link>
          <Link href="/tools/qr-code" className="rounded-md border px-3 py-2 text-sm hover:bg-accent">
            Gerar QR
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Boxes className="h-4 w-4" />} label="Collections" value={stats.collections} />
        <StatCard icon={<Server className="h-4 w-4" />} label="Requests" value={stats.requests} />
        <StatCard icon={<QrCode className="h-4 w-4" />} label="QR Codes" value={stats.qrCodes} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Recentes" value={stats.recentItems} />
      </div>

      {workspace.recentItems.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Últimos itens</p>
          <div className="flex flex-wrap gap-2">
            {workspace.recentItems.slice(0, 6).map((item) => (
              <Link key={item.id} href={item.href} className="rounded-full border px-3 py-1 text-xs hover:bg-accent">
                {item.title}
                {item.subtitle ? <span className="ml-1 text-muted-foreground">· {item.subtitle}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
