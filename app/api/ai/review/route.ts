import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ error: "Código não fornecido" }, { status: 400 });
    }

    const { env } = await getCloudflareContext();
    const ai = (env as Record<string, unknown>).AI as {
      run: (model: string, options: unknown) => Promise<{ response?: string }>;
    };

    if (!ai) {
      return NextResponse.json({ error: "AI não disponível neste ambiente. Configure o Cloudflare AI." }, { status: 503 });
    }

    const result = await ai.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        {
          role: "system",
          content: `Você é um engenheiro de software sênior especializado em ${language}.
Analise o código fornecido e forneça uma revisão detalhada em português cobrindo:

1. **Bugs e Problemas**: Identifique erros, edge cases e comportamentos inesperados
2. **Performance**: Sugira otimizações de desempenho
3. **Segurança**: Aponte vulnerabilidades de segurança (injeção, XSS, etc.)
4. **Boas Práticas**: Sugira padrões e convenções da linguagem
5. **Legibilidade**: Comente sobre clareza, nomenclatura e manutenibilidade
6. **Refatoração**: Sugira melhorias concretas com exemplos quando relevante

Seja específico, objetivo e construtivo. Use markdown para organizar a resposta.`,
        },
        { role: "user", content: `Código ${language}:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`` },
      ],
      max_tokens: 1024,
    });

    return NextResponse.json({ result: result.response ?? "Sem resposta da AI." });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno: " + (e as Error).message }, { status: 500 });
  }
}
