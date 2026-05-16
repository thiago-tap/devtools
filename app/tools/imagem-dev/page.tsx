"use client";

import { useRef, useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

async function postImage(file: File, action: string): Promise<{ blob?: Blob; error?: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("action", action);
  const res = await fetch("/api/images/process", { method: "POST", body: form });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return { error: (j as { error?: string }).error ?? res.statusText };
  }
  return { blob: await res.blob() };
}

function dl(blob: Blob, name: string) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
}

export default function ImagemDevPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: string, name: string) => {
    const f = file ?? inputRef.current?.files?.[0];
    if (!f) {
      setError("Selecione uma imagem.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { blob, error: err } = await postImage(f, action);
      if (err || !blob) {
        setError(err ?? "Falhou");
        return;
      }
      dl(blob, name);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolLayout
      title="Imagem para dev"
      description="Remova metadados EXIF/ICC ou gere um ZIP com PNGs de favicon em vários tamanhos."
    >
      <Panel title="Ficheiro">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="text-sm mb-3 block"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground mb-4">
          Saída <strong>strip</strong> é PNG. O pack de favicons inclui 16–512 px em PNG dentro de um ZIP.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={loading}
            onClick={() => void run("strip_metadata", "sem-meta.png")}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Remover metadados (PNG)
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => void run("favicon_pack", "favicons.zip")}
          >
            Pack favicons (ZIP)
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </Panel>
    </ToolLayout>
  );
}
