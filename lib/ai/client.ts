export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type RunChatOptions = {
  messages: ChatMessage[];
  maxTokens?: number;
};

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "IA não configurada. Defina OPENAI_API_KEY (OpenAI, Groq, OpenRouter) ou OLLAMA_BASE_URL no servidor."
    );
    this.name = "AiNotConfiguredError";
  }
}

function isOpenRouter(baseUrl: string) {
  return baseUrl.includes("openrouter.ai");
}

function resolveOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const defaultModel = isOpenRouter(baseUrl)
    ? "meta-llama/llama-3.1-8b-instruct"
    : "gpt-4o-mini";
  const model = process.env.AI_MODEL?.trim() || defaultModel;

  return { apiKey, baseUrl, model };
}

function buildOpenAiHeaders(config: { apiKey: string; baseUrl: string }) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (isOpenRouter(config.baseUrl)) {
    const referer = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://devtools.catiteo.com";
    const title = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "DevToolbox";
    headers["HTTP-Referer"] = referer;
    headers["X-Title"] = title;
  }

  return headers;
}

function resolveOllamaConfig() {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim();
  if (!baseUrl) return null;

  const model = process.env.OLLAMA_MODEL?.trim() || "llama3";
  return { baseUrl: baseUrl.replace(/\/$/, ""), model };
}

async function runOpenAiChat(
  config: { apiKey: string; baseUrl: string; model: string },
  options: RunChatOptions
): Promise<string> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildOpenAiHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages: options.messages,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Provedor de IA retornou ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("Resposta vazia do provedor de IA.");
  }

  return content;
}

async function runOllamaChat(
  config: { baseUrl: string; model: string },
  options: RunChatOptions
): Promise<string> {
  const res = await fetch(`${config.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      messages: options.messages,
      stream: false,
      options: { num_predict: options.maxTokens ?? 1024 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama retornou ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const content = data.message?.content;
  if (!content?.trim()) {
    throw new Error("Resposta vazia do Ollama.");
  }

  return content;
}

/** Executa chat com OpenAI-compatible API ou Ollama (prioridade: OPENAI_* → OLLAMA_*). */
export async function runChat(options: RunChatOptions): Promise<string> {
  const openAi = resolveOpenAiConfig();
  if (openAi) return runOpenAiChat(openAi, options);

  const ollama = resolveOllamaConfig();
  if (ollama) return runOllamaChat(ollama, options);

  throw new AiNotConfiguredError();
}

export function isAiConfigured(): boolean {
  return Boolean(resolveOpenAiConfig() || resolveOllamaConfig());
}
