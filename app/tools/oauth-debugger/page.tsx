"use client";

import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { buildAuthorizationUrl, generatePkcePair, randomState } from "@/lib/tools/oauth";

export default function OAuthDebuggerPage() {
  const [authorizationEndpoint, setAuthorizationEndpoint] = useState("https://issuer.example.com/oauth/authorize");
  const [clientId, setClientId] = useState("client_id");
  const [redirectUri, setRedirectUri] = useState("https://app.example.com/callback");
  const [scope, setScope] = useState("openid profile email");
  const [state, setState] = useState(randomState());
  const [verifier, setVerifier] = useState("");
  const [challenge, setChallenge] = useState("");

  const authUrl = challenge ? buildAuthorizationUrl({ authorizationEndpoint, clientId, redirectUri, scope, state, codeChallenge: challenge }) : "";

  async function generate() {
    const pair = await generatePkcePair();
    setVerifier(pair.verifier);
    setChallenge(pair.challenge);
    setState(randomState());
  }

  return (
    <ToolLayout title="OAuth/OIDC Debugger" description="Gere PKCE, state e URLs de autorização para fluxos OAuth/OIDC.">
      <Panel title="Configuração">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input value={authorizationEndpoint} onChange={(e) => setAuthorizationEndpoint(e.target.value)} className="font-mono" />
          <Input value={clientId} onChange={(e) => setClientId(e.target.value)} className="font-mono" />
          <Input value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} className="font-mono" />
          <Input value={scope} onChange={(e) => setScope(e.target.value)} className="font-mono" />
        </div>
        <Button className="mt-3" onClick={() => void generate()}>Gerar PKCE + URL</Button>
      </Panel>
      {authUrl && (
        <Panel title="Resultado" actions={<CopyButton text={authUrl} />}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Code verifier</p>
            <code className="block rounded bg-muted p-2 text-xs break-all">{verifier}</code>
            <p className="text-xs text-muted-foreground">Code challenge</p>
            <code className="block rounded bg-muted p-2 text-xs break-all">{challenge}</code>
            <p className="text-xs text-muted-foreground">Authorization URL</p>
            <code className="block rounded bg-muted p-2 text-xs break-all">{authUrl}</code>
          </div>
        </Panel>
      )}
    </ToolLayout>
  );
}
