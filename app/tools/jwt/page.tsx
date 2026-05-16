"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { decodeJWT, formatJWTClaim } from "@/lib/tools/jwt";
import { signJwtHS256 } from "@/lib/tools/jwt-sign";
import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";

type Tab = "decode" | "sign";

export default function JWTPage() {
  const [tab, setTab] = useState<Tab>("decode");
  const [input, setInput] = useState("");
  const decoded = input.trim() ? decodeJWT(input) : null;

  const [secret, setSecret] = useState("");
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "test",\n  "iat": 1710000000\n}');
  const [signError, setSignError] = useState("");
  const [signed, setSigned] = useState("");

  const sign = () => {
    setSignError("");
    setSigned("");
    if (!secret) {
      setSignError("Secret obrigatório.");
      return;
    }
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadJson) as Record<string, unknown>;
    } catch {
      setSignError("JSON do payload inválido.");
      return;
    }
    try {
      setSigned(signJwtHS256(payload, secret));
    } catch (e) {
      setSignError((e as Error).message);
    }
  };

  return (
    <ToolLayout title="JWT" description="Decodifique tokens ou gere JWT HS256 para testes locais.">
      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === "decode" ? "default" : "outline"} size="sm" onClick={() => setTab("decode")}>
          Decodificar
        </Button>
        <Button variant={tab === "sign" ? "default" : "outline"} size="sm" onClick={() => setTab("sign")}>
          Gerar (HS256)
        </Button>
      </div>

      {tab === "decode" && (
        <>
          <div className="text-sm text-muted-foreground p-3 rounded-lg border bg-muted/30">
            Esta ferramenta <strong className="text-foreground">não valida a assinatura</strong> do token
            (não verifica se foi emitido por um emissor confiável). Use apenas para debug local.
            Tokens decodificados podem estar expirados ou forjados.
          </div>
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
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${decoded.result.isExpired ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-400"}`}
              >
                {decoded.result.isExpired ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
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
        </>
      )}

      {tab === "sign" && (
        <>
          <div className="text-sm text-muted-foreground p-3 rounded-lg border bg-destructive/5 border-destructive/20">
            <strong className="text-foreground">Aviso:</strong> gerar HS256 no browser envolve o segredo no
            JavaScript. Use apenas para desenvolvimento; em produção, assine no servidor.
          </div>
          <Panel title="Secret (HS256)">
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Chave partilhada"
              className="font-mono text-sm"
            />
          </Panel>
          <Panel title="Payload (JSON)" actions={signed ? <CopyButton text={signed} /> : undefined}>
            <Textarea
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <Button type="button" size="sm" onClick={sign}>
                Gerar JWT
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const iat = Math.floor(Date.now() / 1000);
                  setPayloadJson(JSON.stringify({ sub: "test", iat }, null, 2));
                }}
              >
                Atualizar iat (agora)
              </Button>
            </div>
            {signError && (
              <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {signError}
              </p>
            )}
            {signed && (
              <div className="mt-4">
                <Badge variant="outline" className="mb-2">
                  Token
                </Badge>
                <pre className="text-xs font-mono break-all whitespace-pre-wrap rounded-md bg-muted p-3">{signed}</pre>
              </div>
            )}
          </Panel>
        </>
      )}
    </ToolLayout>
  );
}
