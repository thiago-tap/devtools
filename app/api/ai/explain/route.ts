import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { parseJsonBody, withApiGuards } from "@/lib/api/security";

const PROMPTS: Record<string, string> = {
  json: "Você é um especialista em APIs e estruturas de dados. Explique de forma concisa e em português o que este JSON representa, sua estrutura e propósito. Máximo 3 parágrafos.",
  regex: "Você é um especialista em expressões regulares. Explique em português o que esta regex faz, parte por parte, de forma clara para um desenvolvedor. Seja conciso.",
  sql: "Você é um DBA experiente. Explique em português o que esta query SQL faz, passo a passo, mencionando performance e possíveis índices necessários. Seja objetivo.",
};

const MAX_CODE_LENGTH = 24_000;

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request, { limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await parseJsonBody<{ code?: string; type?: string }>(request);
  if (!body.ok) return body.response;

  try {
    const { code, type } = body.data;

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

    const systemPrompt =
      PROMPTS[type ?? ""] ?? "Explique o seguinte código de forma clara e em português.";

    const result = await ai.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `\`\`\`\n${code}\n\`\`\`` },
      ],
      max_tokens: 512,
    });

    return NextResponse.json({ result: result.response ?? "Sem resposta da AI." });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno: " + (e as Error).message }, { status: 500 });
  }
}
