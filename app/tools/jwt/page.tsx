"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/tools/copy-button";
import { decodeJWT, formatJWTClaim } from "@/lib/tools/jwt";
import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";

export default function JWTPage() {
  const [input, setInput] = useState("");
  const decoded = input.trim() ? decodeJWT(input) : null;

  return (
    <ToolLayout title="Decodificador JWT" description="Decodifique e inspecione tokens JWT com validação de expiração">
      <Panel title="Token JWT">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cole seu token JWT aqui: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          className="min-h-[100px] text-xs font-mono"
        />
      </Panel>

      {decoded?.error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">{decoded.error}</p>
        </div>
      )}

      {decoded?.result && (
        <>
          {/* Status banner */}
          <div className={`flex items-center gap-3 p-4 rounded-lg ${decoded.result.isExpired ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-400"}`}>
            {decoded.result.isExpired
              ? <ShieldAlert className="h-5 w-5" />
              : <ShieldCheck className="h-5 w-5" />}
            <div>
              <p className="font-semibold text-sm">
                {decoded.result.isExpired ? "Token Expirado" : "Token Válido"}
              </p>
              {decoded.result.expiresAt && (
                <p className="text-xs opacity-80">
                  {decoded.result.isExpired ? "Expirou em: " : "Expira em: "}
                  {decoded.result.expiresAt.toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Header */}
            <Panel title="Header" actions={<CopyButton text={JSON.stringify(decoded.result.header, null, 2)} />}>
              <div className="space-y-2">
                {Object.entries(decoded.result.header).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-xs text-purple-400 font-mono">{k}</span>
                    <span className="text-sm font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Payload */}
            <Panel title="Payload" actions={<CopyButton text={JSON.stringify(decoded.result.payload, null, 2)} />}>
              <div className="space-y-2">
                {Object.entries(decoded.result.payload).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-xs text-blue-400 font-mono">{formatJWTClaim(k, v)}</span>
                    <span className="text-sm font-mono break-all">
                      {(k === "exp" || k === "iat" || k === "nbf") && typeof v === "number"
                        ? new Date(v * 1000).toLocaleString("pt-BR")
                        : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Signature */}
            <Panel title="Signature">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Signature (não verificada)</p>
                <code className="text-xs font-mono text-yellow-400 break-all">{decoded.result.signature}</code>
                <p className="text-xs text-muted-foreground mt-3">
                  A verificação da assinatura requer a chave secreta e deve ser feita no servidor.
                </p>
              </div>
            </Panel>
          </div>
        </>
      )}
    </ToolLayout>
  );
}
