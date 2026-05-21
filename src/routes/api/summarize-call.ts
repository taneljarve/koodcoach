import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { callAIJson, gatewayErrorResponse } from "@/lib/ai-gateway.server";
import { CALL_SUMMARY_SYSTEM, buildCallSummaryPrompt } from "@/lib/prompts";
import type { CallSummary } from "@/lib/review-types";

type Body = { transcript?: string };

export const Route = createFileRoute("/api/summarize-call")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!body.transcript || body.transcript.trim().length < 20) {
            return Response.json(
              { error: "transcript is required (at least a few sentences)" },
              { status: 400 },
            );
          }
          if (body.transcript.length > 30000) {
            return Response.json({ error: "transcript too long" }, { status: 400 });
          }
          const result = await callAIJson<CallSummary>([
            { role: "system", content: CALL_SUMMARY_SYSTEM },
            { role: "user", content: buildCallSummaryPrompt({ transcript: body.transcript }) },
          ]);
          return Response.json(result);
        } catch (err) {
          return gatewayErrorResponse(err);
        }
      },
    },
  },
});
