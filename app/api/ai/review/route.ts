import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
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

    const { env } = await getCloudflareContext();
    const ai = (env as Record<string, unknown>).AI as {
      run: (model: string, options: unknown) => Promise<{ response?: string }>;
    };

    if (!ai) {
      return NextResponse.json(
        { error: "AI não disponível neste ambiente. Configure o Cloudflare AI." },
        { status: 503 }
      );
    }

    const lang = language ?? "código";

    const result = await ai.run("@cf/meta/llama-3-8b-instruct", {
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
      max_tokens: 1024,
    });

    return NextResponse.json({ result: result.response ?? "Sem resposta da AI." });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno: " + (e as Error).message }, { status: 500 });
  }
}
