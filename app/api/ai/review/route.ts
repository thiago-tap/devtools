import { type NextRequest, NextResponse } from "next/server";
import { AiNotConfiguredError, runChat } from "@/lib/ai/client";
import { parseJsonBody, withApiGuards } from "@/lib/api/security";

const MAX_CODE_LENGTH = 24_000;

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request, { limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await parseJsonBody<{ code?: string; language?: string }>(request);
  if (!body.ok) return body.response;

  try {
    const { code, language } = body.data;

    if (!code?.trim()) {
      return NextResponse.json({ error: "Código não fornecido" }, { status: 400 });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { error: `Código excede o limite de ${MAX_CODE_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    const lang = language ?? "código";

    const result = await runChat({
      maxTokens: 1024,
      messages: [
        {
          role: "system",
          content: `Você é um engenheiro de software sênior especializado em ${lang}.
Analise o código fornecido e forneça uma revisão detalhada em português cobrindo:

1. **Bugs e Problemas**: Identifique erros, edge cases e comportamentos inesperados
2. **Performance**: Sugira otimizações de desempenho
3. **Segurança**: Aponte vulnerabilidades de segurança (injeção, XSS, etc.)
4. **Boas Práticas**: Sugira padrões e convenções da linguagem
5. **Legibilidade**: Comente sobre clareza, nomenclatura e manutenibilidade
6. **Refatoração**: Sugira melhorias concretas com exemplos quando relevante

Seja específico, objetivo e construtivo. Use markdown para organizar a resposta.`,
        },
        {
          role: "user",
          content: `Código ${lang}:\n\`\`\`${lang.toLowerCase()}\n${code}\n\`\`\``,
        },
      ],
    });

    return NextResponse.json({ result });
  } catch (e) {
    if (e instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erro interno: " + (e as Error).message }, { status: 500 });
  }
}
