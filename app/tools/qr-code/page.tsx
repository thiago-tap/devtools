"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addRecentItem, loadWorkspace, saveQrCode, saveWorkspace, type WorkspaceQrCode } from "@/lib/storage/workspaces";

function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { width: 280, margin: 2, errorCorrectionLevel: "M" });
}

export default function QrCodePage() {
  const [text, setText] = useState("https://devtools.catiteo.com");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<WorkspaceQrCode[]>([]);
  const [saving, setSaving] = useState(false);
  const trimmedText = text.trim();
  const hasText = trimmedText.length > 0;

  useEffect(() => {
    setGenerated(loadWorkspace().qrCodes);
  }, []);

  useEffect(() => {
    if (!hasText) {
      setDataUrl("");
      setError("");
      return;
    }

    let cancelled = false;
    void generateQrDataUrl(text)
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setDataUrl("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hasText, text]);

  async function saveCurrentQr(): Promise<void> {
    if (!hasText) return;
    setSaving(true);
    try {
      const qrDataUrl = dataUrl || (await generateQrDataUrl(trimmedText));
      const withQr = saveQrCode(loadWorkspace(), { text: trimmedText, dataUrl: qrDataUrl });
      const next = addRecentItem(withQr, {
        type: "qr-code",
        title: "QR Code",
        href: "/tools/qr-code",
        subtitle: trimmedText,
        dedupeKey: `qr:${trimmedText}`,
      });
      saveWorkspace(next);
      setGenerated(next.qrCodes);
      setDataUrl(qrDataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar QR Code");
    } finally {
      setSaving(false);
    }
  }

  function startNewQr(): void {
    setText("");
    setError("");
    setDataUrl("");
  }

  return (
    <ToolLayout
      title="Gerador QR Code"
      description="Gere QR em PNG (data URL) no browser — ideal para testes e partilha rápida."
    >
      <Panel title="Conteúdo">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="URL ou texto…"
          className="min-h-[120px] font-mono text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void saveCurrentQr()} disabled={!hasText || saving}>
            {saving ? "Adicionando..." : "Adicionar QR à lista"}
          </Button>
          <Button variant="outline" onClick={startNewQr}>
            Novo QR
          </Button>
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {dataUrl && (
          <div className="mt-6 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt="QR Code"
              className="rounded-lg border bg-white p-2"
              width={280}
              height={280}
            />
            <a
              href={dataUrl}
              download="qrcode.png"
              className="text-sm text-primary underline"
            >
              Descarregar PNG
            </a>
          </div>
        )}
      </Panel>

      {generated.length > 0 && (
        <Panel title={`QR Codes gerados (${generated.length})`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generated.map((item, index) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">QR #{generated.length - index}</p>
                  <span className="text-[11px] text-muted-foreground">{item.createdAt}</span>
                </div>
                <p className="mt-2 text-xs font-mono break-all text-muted-foreground">{item.text}</p>
                <div className="mt-3 flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.dataUrl}
                    alt={`QR Code para ${item.text}`}
                    className="rounded-lg border bg-white p-2"
                    width={180}
                    height={180}
                  />
                  <a
                    href={item.dataUrl}
                    download={`qrcode-${item.id}.png`}
                    className="text-sm text-primary underline"
                  >
                    Descarregar PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
