import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { callAIJson, gatewayErrorResponse } from "@/lib/ai-gateway.server";
import { MENTOR_SYSTEM, buildImprovePrompt } from "@/lib/prompts";

type Body = { feedback?: string; guideContext?: string };

export const Route = createFileRoute("/api/improve-feedback")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!body.feedback || body.feedback.trim().length < 3) {
            return Response.json({ error: "feedback is required" }, { status: 400 });
          }
          const result = await callAIJson<{
            scores: { specificity: number; constructiveness: number; actionability: number };
            suggestions: string[];
            missing: string[];
            strengths: string[];
          }>([
            { role: "system", content: MENTOR_SYSTEM },
            {
              role: "user",
              content: buildImprovePrompt({
                feedback: body.feedback,
                guideContext: body.guideContext,
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
