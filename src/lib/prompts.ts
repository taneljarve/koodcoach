// Centralized prompts for the AI mentor. The AI must coach, not solve.

export const MENTOR_SYSTEM = `You are a peer-review coach for software students.
Your role is to help reviewers give better, more constructive feedback — and help
submitters learn from feedback. You are a MENTOR, not an auto-solver.

Strict rules:
- NEVER write the solution to the assignment.
- NEVER post corrected code or fixes the submitter could copy.
- Promote critical thinking through guiding questions.
- Identify gaps, edge cases, and learning opportunities.
- Keep language clear, kind, and educational.
- Always respond as valid JSON matching the requested schema. No prose outside JSON.`;

export function buildGuidePrompt(input: {
  title: string;
  description: string;
  criteria: string;
  code?: string;
}) {
  return `Generate a peer-review GUIDE for the following assignment. Do not solve it.

Task title: ${input.title}
Task description:
${input.description}

Testing criteria:
${input.criteria}

${input.code ? `Submitted code (read it to spot review angles, do NOT rewrite or fix it):\n${input.code}` : "No code submission was provided. Focus on conceptual review angles."}

Return JSON exactly in this shape (all arrays of short strings, 4-6 items each):
{
  "reviewChecklist": [],
  "guidingQuestions": [],
  "edgeCases": [],
  "commonMistakes": [],
  "focusAreas": []
}

Guidelines:
- reviewChecklist: concrete things a reviewer should verify.
- guidingQuestions: open-ended questions that prompt the submitter to reflect.
- edgeCases: tricky inputs/states the submitter might miss.
- commonMistakes: anti-patterns or shortcuts students typically take here.
- focusAreas: high-leverage learning topics tied to this task.`;
}

export function buildImprovePrompt(input: {
  feedback: string;
  guideContext?: string;
}) {
  return `A peer reviewer wrote the following feedback. Coach them to make it stronger
WITHOUT writing the actual review for them.

Reviewer feedback:
"""
${input.feedback}
"""

${input.guideContext ? `Context from the review guide:\n${input.guideContext}\n` : ""}

Return JSON in this exact shape:
{
  "scores": {
    "specificity": 0,
    "constructiveness": 0,
    "actionability": 0
  },
  "suggestions": [],
  "missing": [],
  "strengths": []
}

Rules:
- Each score is an integer 0-100 reflecting that quality.
- "suggestions" are 3-5 short coaching prompts like "Can you explain why this matters?"
  or "What edge cases are missing?" — questions, not rewrites.
- "missing" lists aspects the feedback overlooked.
- "strengths" lists what the reviewer did well (can be empty if truly weak).`;
}

export function buildSummaryPrompt(input: {
  guide: string;
  feedback: string;
}) {
  return `Summarize the peer-review outcome FOR THE SUBMITTER. Help them learn —
do not provide the solution.

Review guide context:
${input.guide}

Reviewer feedback:
${input.feedback}

Return JSON in this exact shape:
{
  "keyIssues": [],
  "learningTopics": [],
  "improvementPriorities": []
}

Guidelines:
- keyIssues: 3-5 short bullets of the most important problems raised.
- learningTopics: 3-5 concepts the submitter should study to grow.
- improvementPriorities: 3-5 ordered next actions (most impactful first).`;
}
