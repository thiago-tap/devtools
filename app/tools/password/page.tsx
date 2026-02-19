"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/tools/copy-button";
import { generatePassword, scorePassword, type PasswordOptions } from "@/lib/tools/password";
import { RefreshCw } from "lucide-react";

export default function PasswordPage() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [passwords, setPasswords] = useState<string[]>(() =>
    Array.from({ length: 5 }, () => generatePassword({
      length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false,
    }))
  );

  const generate = () => setPasswords(Array.from({ length: 5 }, () => generatePassword(options)));
  const toggle = (key: keyof PasswordOptions) => setOptions((o) => ({ ...o, [key]: !o[key] }));

  const score = passwords[0] ? scorePassword(passwords[0]) : null;

  return (
    <ToolLayout title="Gerador de Senha" description="Gere senhas seguras com regras customizáveis e análise de força">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Configurações">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Comprimento: {options.length}</label>
              <input
                type="range" min={6} max={128} value={options.length}
                onChange={(e) => setOptions((o) => ({ ...o, length: parseInt(e.target.value) }))}
                className="w-full mt-1"
              />
            </div>
            {(["uppercase", "lowercase", "numbers", "symbols", "excludeAmbiguous"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={options[key] as boolean} onChange={() => toggle(key)} className="rounded" />
                <span className="text-sm">
                  {key === "uppercase" ? "Maiúsculas (A-Z)" :
                    key === "lowercase" ? "Minúsculas (a-z)" :
                    key === "numbers" ? "Números (0-9)" :
                    key === "symbols" ? "Símbolos (!@#$...)" :
                    "Excluir ambíguos (0, O, l, 1)"}
                </span>
              </label>
            ))}
            <Button onClick={generate} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar senhas
            </Button>
          </div>
        </Panel>

        <div className="lg:col-span-2 space-y-3">
          {/* Strength meter */}
          {score && (
            <Panel title="Força da senha">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium" style={{ color: score.color }}>{score.label}</span>
                  <span className="text-xs text-muted-foreground">{score.score}/7</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(score.score / 7) * 100}%`, backgroundColor: score.color }}
                  />
                </div>
                {score.tips.length > 0 && (
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                    {score.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                )}
              </div>
            </Panel>
          )}

          {/* Generated passwords */}
          <Panel title="Senhas geradas" actions={<Button size="sm" variant="ghost" onClick={generate}><RefreshCw className="h-3 w-3" /></Button>}>
            <div className="space-y-2">
              {passwords.map((pwd, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <code className="font-mono text-sm flex-1 break-all">{pwd}</code>
                  <CopyButton text={pwd} size="icon" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </ToolLayout>
  );
}
