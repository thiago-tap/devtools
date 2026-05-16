"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";

export default function QrCodePage() {
  const [text, setText] = useState("https://devtools.catiteo.com");
  const [dataUrl, setDataUrl] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(text || " ", { width: 280, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setErr("");
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setDataUrl("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

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
        {err && <p className="text-sm text-destructive mt-2">{err}</p>}
        {dataUrl && (
          <div className="mt-6 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="QR Code" className="rounded-lg border bg-white p-2" width={280} height={280} />
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
    </ToolLayout>
  );
}
