// Server-only helper for Lovable AI Gateway. Do not import from client code.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callAIJson<T = unknown>(
  messages: ChatMessage[],
  opts: { model?: string } = {},
): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GatewayError(res.status, text || res.statusText);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  try {
    return JSON.parse(content) as T;
  } catch {
    // Try to extract JSON from a possible code-fenced block
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI response was not valid JSON");
  }
}

export class GatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "GatewayError";
  }
}

export function gatewayErrorResponse(err: unknown): Response {
  if (err instanceof GatewayError) {
    if (err.status === 429) {
      return Response.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 },
      );
    }
    if (err.status === 402) {
      return Response.json(
        { error: "AI credits exhausted. Add credits in Workspace Settings → Usage." },
        { status: 402 },
      );
    }
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return Response.json({ error: message }, { status: 500 });
}
