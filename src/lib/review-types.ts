export type ReviewGuide = {
  reviewChecklist: string[];
  guidingQuestions: string[];
  edgeCases: string[];
  commonMistakes: string[];
  focusAreas: string[];
};

export type FeedbackAnalysis = {
  scores: { specificity: number; constructiveness: number; actionability: number };
  suggestions: string[];
  missing: string[];
  strengths: string[];
};

export type SubmitterSummary = {
  keyIssues: string[];
  learningTopics: string[];
  improvementPriorities: string[];
};

export type AssignmentInput = {
  title: string;
  description: string;
  criteria: string;
  code: string;
};

export type ExplainResult = {
  summary: string;
  lineByLine: Array<{ range: string; what: string; why: string }>;
  concepts: Array<{ name: string; whyItMatters: string }>;
  performance: string[];
  security: string[];
  missingEdgeCases: string[];
  questionsToAskAuthor: string[];
};

export type CallSummary = {
  tlDr: string[];
  decisions: string[];
  actionItems: Array<{ owner: "submitter" | "reviewer"; task: string; why: string }>;
  openQuestions: string[];
  learningMoments: string[];
  feedbackQuality: { specificity: number; constructiveness: number; actionability: number };
};

export const MOCK_ASSIGNMENT: AssignmentInput = {
  title: "Implement a debounce utility",
  description:
    "Write a `debounce(fn, wait)` higher-order function in TypeScript. The returned function should delay invoking `fn` until `wait` ms have elapsed since the last call. Include a `.cancel()` method.",
  criteria:
    "- debounce only invokes once for rapid sequential calls\n- last arguments are used\n- .cancel() prevents the pending call\n- works with `this` binding\n- no memory leaks (timers cleared)",
  code: `export function debounce(fn, wait) {
  let t;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}`,
};

export const MOCK_SNIPPET = `function getUser(id) {
  const sql = "SELECT * FROM users WHERE id = '" + id + "'";
  return db.query(sql).then(rows => {
    document.getElementById("name").innerHTML = rows[0].name;
    return rows[0];
  });
}`;
