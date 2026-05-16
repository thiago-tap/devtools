"use client";

import { useMemo, useState } from "react";
import semver from "semver";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Input } from "@/components/ui/input";

export default function SemverPage() {
  const [a, setA] = useState("1.2.3");
  const [b, setB] = useState("1.2.4");
  const [base, setBase] = useState("2.0.0");

  const cmp = useMemo(() => {
    const va = semver.coerce(a);
    const vb = semver.coerce(b);
    if (!va || !vb) return { error: "Versões inválidas" as const };
    const r = semver.compare(va, vb);
    return {
      error: null as null,
      text: r === 0 ? "iguais" : r > 0 ? `${va.version} > ${vb.version}` : `${va.version} < ${vb.version}`,
    };
  }, [a, b]);

  const bumps = useMemo(() => {
    const v = semver.valid(semver.coerce(base)?.version ?? "");
    if (!v) return null;
    return {
      patch: semver.inc(v, "patch"),
      minor: semver.inc(v, "minor"),
      major: semver.inc(v, "major"),
    };
  }, [base]);

  return (
    <ToolLayout
      title="Semver"
      description="Compare versões e calcule bumps patch / minor / major (npm semver)."
    >
      <Panel title="Comparar">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">A</label>
            <Input value={a} onChange={(e) => setA(e.target.value)} className="w-40 font-mono" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">B</label>
            <Input value={b} onChange={(e) => setB(e.target.value)} className="w-40 font-mono" />
          </div>
        </div>
        <p className="mt-3 text-sm">
          {cmp.error ? <span className="text-destructive">{cmp.error}</span> : <span>{cmp.text}</span>}
        </p>
      </Panel>

      <Panel title="Bump a partir de uma versão base">
        <Input value={base} onChange={(e) => setBase(e.target.value)} className="max-w-xs font-mono mb-3" />
        {bumps ? (
          <ul className="text-sm font-mono space-y-1">
            <li>patch → {bumps.patch}</li>
            <li>minor → {bumps.minor}</li>
            <li>major → {bumps.major}</li>
          </ul>
        ) : (
          <p className="text-sm text-destructive">Versão base inválida</p>
        )}
      </Panel>
    </ToolLayout>
  );
}
