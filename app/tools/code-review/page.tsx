"use client";
import { useState } from "react";
import { ToolLayout, Panel } from "@/components/layout/tool-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";

const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "SQL", "CSS", "Other"];

export default function CodeReviewPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [converted, setConverted] = useState("");
  const [targetLang, setTargetLang] = useState("Python");
  const [convertLoading, setConvertLoading] = useState(false);

  const runReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setReview("");
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setReview(data.result || data.error);
    } finally {
      setLoading(false);
    }
  };

  const convertCode = async () => {
    if (!code.trim()) return;
    setConvertLoading(true);
    setConverted("");
    try {
      const res = await fetch("/api/ai/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, from: language, to: targetLang }),
      });
      const data = await res.json();
      setConverted(data.result || data.error);
    } finally {
      setConvertLoading(false);
    }
  };

  return (
    <ToolLayout title="Revisão de Código com IA" description="Revise e converta código com IA: bugs, performance e boas práticas" hasAI>
      {/* Language selector */}
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <Button
            key={lang}
            variant={language === lang ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage(lang)}
          >
            {lang}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title={`Código ${language}`}
          actions={
            <Button size="sm" onClick={runReview} disabled={loading || !code.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {loading ? "Analisando..." : "Revisar com AI"}
            </Button>
          }
        >
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Cole seu código ${language} aqui...`}
            className="min-h-[400px] text-xs"
          />
        </Panel>

        <Panel
          title="Revisão IA"
          actions={review ? <Badge variant="success">Concluído</Badge> : undefined}
        >
          {loading ? (
            <div className="flex items-center justify-center h-[400px] gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>A AI está analisando seu código...</span>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none min-h-[400px]">
              {review ? (
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{review}</pre>
              ) : (
                <p className="text-muted-foreground text-sm">
                  O feedback da AI aparecerá aqui. A análise cobre:
                  <br /><br />
                  • Bugs e problemas potenciais<br />
                  • Performance e otimizações<br />
                  • Boas práticas e padrões<br />
                  • Segurança<br />
                  • Legibilidade e manutenibilidade
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* Code conversion */}
      <Panel title="Converter para outra linguagem">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm text-muted-foreground">Converter de</span>
          <Badge variant="secondary">{language}</Badge>
          <span className="text-sm text-muted-foreground">para:</span>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.filter((l) => l !== language).map((lang) => (
              <Button
                key={lang}
                variant={targetLang === lang ? "default" : "outline"}
                size="sm"
                onClick={() => setTargetLang(lang)}
              >
                {lang}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={convertCode} disabled={convertLoading || !code.trim()}>
            {convertLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {convertLoading ? "Convertendo..." : "Converter"}
          </Button>
        </div>
        {converted && (
          <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-[300px]">
            {converted}
          </pre>
        )}
      </Panel>
    </ToolLayout>
  );
}
