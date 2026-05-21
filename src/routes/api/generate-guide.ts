import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { callAIJson, gatewayErrorResponse } from "@/lib/ai-gateway.server";
import { MENTOR_SYSTEM, buildGuidePrompt } from "@/lib/prompts";

type Body = {
  title?: string;
  description?: string;
  criteria?: string;
  code?: string;
};

export const Route = createFileRoute("/api/generate-guide")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!body.title || !body.description || !body.criteria) {
            return Response.json(
              { error: "title, description and criteria are required" },
              { status: 400 },
            );
          }
          const guide = await callAIJson<{
            reviewChecklist: string[];
            guidingQuestions: string[];
            edgeCases: string[];
            commonMistakes: string[];
            focusAreas: string[];
          }>([
            { role: "system", content: MENTOR_SYSTEM },
            {
              role: "user",
              content: buildGuidePrompt({
                title: body.title,
                description: body.description,
                criteria: body.criteria,
                code: body.code,
              }),
            },
          ]);
          return Response.json(guide);
        } catch (err) {
          return gatewayErrorResponse(err);
        }
      },
    },
  },
});
