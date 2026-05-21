import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { callAIJson, gatewayErrorResponse } from "@/lib/ai-gateway.server";
import { MENTOR_SYSTEM, buildSummaryPrompt } from "@/lib/prompts";

type Body = { guide?: string; feedback?: string };

export const Route = createFileRoute("/api/summarize")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!body.guide || !body.feedback) {
            return Response.json(
              { error: "guide and feedback are required" },
              { status: 400 },
            );
          }
          const result = await callAIJson<{
            keyIssues: string[];
            learningTopics: string[];
            improvementPriorities: string[];
          }>([
            { role: "system", content: MENTOR_SYSTEM },
            {
              role: "user",
              content: buildSummaryPrompt({
                guide: body.guide,
                feedback: body.feedback,
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
