import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: NextRequest) {
  try {
    const { code, from, to } = await request.json();

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
          content: `Você é um especialista em múltiplas linguagens de programação.
Converta o código de ${from} para ${to} mantendo a mesma lógica e funcionalidade.
Responda APENAS com o código convertido, sem explicações, sem markdown, sem blocos de código.
O código deve ser idiomático e seguir as convenções de ${to}.`,
        },
        { role: "user", content: `Converta este código de ${from} para ${to}:\n\n${code}` },
      ],
      max_tokens: 1024,
    });

    return NextResponse.json({ result: result.response ?? "Sem resposta da AI." });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno: " + (e as Error).message }, { status: 500 });
  }
}
