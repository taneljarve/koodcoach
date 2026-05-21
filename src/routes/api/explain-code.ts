import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { callAIJson, gatewayErrorResponse } from "@/lib/ai-gateway.server";
import { EXPLAIN_SYSTEM, buildExplainPrompt } from "@/lib/prompts";
import type { ExplainResult } from "@/lib/review-types";

type Body = { code?: string; language?: string; question?: string };

export const Route = createFileRoute("/api/explain-code")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!body.code || body.code.trim().length < 5) {
            return Response.json({ error: "code is required" }, { status: 400 });
          }
          if (body.code.length > 8000) {
            return Response.json({ error: "code is too long (max 8000 chars)" }, { status: 400 });
          }
          const result = await callAIJson<ExplainResult>([
            { role: "system", content: EXPLAIN_SYSTEM },
            {
              role: "user",
              content: buildExplainPrompt({
                code: body.code,
                language: body.language,
                question: body.question,
              }),
            },
          ]);
          return Response.json(result);
        } catch (err) {
          return gatewayErrorResponse(err);
        }
      },
    },
  },
});
