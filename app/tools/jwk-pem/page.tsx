"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";

function arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = btoa(binary).match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN ${label}-----\n${base64}\n-----END ${label}-----`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export default function JwkPemPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const jwkToPem = async () => {
    setError("");
    try {
      const jwk = JSON.parse(input) as JsonWebKey;
      const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["verify"]);
      const spki = await crypto.subtle.exportKey("spki", key);
      setOutput(arrayBufferToPem(spki, "PUBLIC KEY"));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const pemToJwk = async () => {
    setError("");
    try {
      const key = await crypto.subtle.importKey("spki", pemToArrayBuffer(input), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["verify"]);
      setOutput(JSON.stringify(await crypto.subtle.exportKey("jwk", key), null, 2));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <ToolLayout title="JWK ↔ PEM" description="Converta chaves públicas RSA entre JWK e PEM/SPKI no browser.">
      <Panel title="Entrada">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[260px] text-xs" />
        <div className="flex gap-2 mt-3">
          <Button onClick={() => void jwkToPem()} disabled={!input.trim()}>JWK → PEM</Button>
          <Button variant="outline" onClick={() => void pemToJwk()} disabled={!input.trim()}>PEM → JWK</Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </Panel>
      <Panel title="Saída" actions={output ? <CopyButton text={output} /> : undefined}>
        <Textarea value={output} readOnly className="min-h-[260px] text-xs" />
      </Panel>
    </ToolLayout>
  );
}
