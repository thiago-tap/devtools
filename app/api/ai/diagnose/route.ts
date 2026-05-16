import { type NextRequest, NextResponse } from "next/server";
import { AiNotConfiguredError, runChat } from "@/lib/ai/client";
import { parseJsonBody, withApiGuards } from "@/lib/api/security";

const MAX_AI_INPUT_LENGTH = 12_000;

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request, { limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await parseJsonBody<{ input?: string; kind?: string }>(request, 40_000);
  if (!body.ok) return body.response;
  const input = body.data.input?.trim();
  if (!input) return NextResponse.json({ error: "Entrada obrigatória" }, { status: 400 });
  if (input.length > MAX_AI_INPUT_LENGTH) {
    return NextResponse.json({ error: `Entrada excede ${MAX_AI_INPUT_LENGTH} caracteres` }, { status: 400 });
  }

  try {
    const result = await runChat({
      maxTokens: 900,
      messages: [
        { role: "system", content: "Você é um engenheiro sênior. Responda em português com diagnóstico, hipóteses, próximos passos e riscos. Seja conciso." },
        { role: "user", content: `${body.data.kind ?? "erro"}:\n\n${input}` },
      ],
    });
    return NextResponse.json({ result });
  } catch (e) {
    if (e instanceof AiNotConfiguredError) return NextResponse.json({ error: e.message }, { status: 503 });
    console.error(e);
    return NextResponse.json({ error: "Erro ao executar diagnóstico" }, { status: 500 });
  }
}
