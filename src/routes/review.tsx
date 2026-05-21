import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeft,
  Sparkles,
  ListChecks,
  HelpCircle,
  AlertTriangle,
  Bug,
  Target,
  Loader2,
  MessageSquareQuote,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { GuideSection } from "@/components/guide-section";
import { FeedbackMeter } from "@/components/feedback-meter";
import {
  MOCK_ASSIGNMENT,
  type AssignmentInput,
  type FeedbackAnalysis,
  type ReviewGuide,
  type SubmitterSummary,
} from "@/lib/review-types";

export const Route = createFileRoute("/review")({
  component: ReviewFlow,
  head: () => ({
    meta: [
      { title: "Start a review — PeerCoach" },
      { name: "description", content: "Generate an AI-assisted review guide and feedback coach." },
    ],
  }),
});

type Step = "input" | "guide" | "summary";

function ReviewFlow() {
  const [step, setStep] = useState<Step>("input");
  const [assignment, setAssignment] = useState<AssignmentInput>({
    title: "",
    description: "",
    criteria: "",
    code: "",
  });
  const [guide, setGuide] = useState<ReviewGuide | null>(null);
  const [feedback, setFeedback] = useState("");
  const [analysis, setAnalysis] = useState<FeedbackAnalysis | null>(null);
  const [summary, setSummary] = useState<SubmitterSummary | null>(null);

  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  async function generateGuide() {
    if (!assignment.title.trim() || !assignment.description.trim() || !assignment.criteria.trim()) {
      toast.error("Please fill title, description, and testing criteria.");
      return;
    }
    setLoadingGuide(true);
    try {
      const res = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignment),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error || "Failed to generate guide");
      }
      const data = (await res.json()) as ReviewGuide;
      setGuide(data);
      setAnalysis(null);
      setSummary(null);
      setFeedback("");
      setStep("guide");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate guide");
    } finally {
      setLoadingGuide(false);
    }
  }

  async function analyzeFeedback() {
    if (feedback.trim().length < 5) {
      toast.error("Write at least a sentence of feedback first.");
      return;
    }
    setLoadingAnalyze(true);
    try {
      const res = await fetch("/api/improve-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback,
          guideContext: guide ? JSON.stringify(guide) : undefined,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error || "Failed to analyze feedback");
      }
      setAnalysis((await res.json()) as FeedbackAnalysis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze feedback");
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function buildSummary() {
    if (!guide || !feedback.trim()) {
      toast.error("Need guide + feedback first.");
      return;
    }
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide: JSON.stringify(guide), feedback }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error || "Failed to summarize");
      }
      setSummary((await res.json()) as SubmitterSummary);
      setStep("summary");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoadingSummary(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors closeButton />
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>PeerCoach</span>
          </Link>
          <Stepper step={step} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {step === "input" && (
          <InputStep
            value={assignment}
            onChange={setAssignment}
            onSubmit={generateGuide}
            loading={loadingGuide}
          />
        )}

        {step === "guide" && guide && (
          <GuideStep
            assignment={assignment}
            guide={guide}
            feedback={feedback}
            setFeedback={setFeedback}
            analysis={analysis}
            onAnalyze={analyzeFeedback}
            loadingAnalyze={loadingAnalyze}
            onBack={() => setStep("input")}
            onContinue={buildSummary}
            loadingSummary={loadingSummary}
          />
        )}

        {step === "summary" && summary && (
          <SummaryStep
            summary={summary}
            onBack={() => setStep("guide")}
            onRestart={() => {
              setStep("input");
              setAssignment({ title: "", description: "", criteria: "", code: "" });
              setGuide(null);
              setFeedback("");
              setAnalysis(null);
              setSummary(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "input", label: "Assignment" },
    { id: "guide", label: "Guide & feedback" },
    { id: "summary", label: "Summary" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);
  return (
    <div className="hidden md:flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <span
            className={
              "inline-flex h-6 w-6 items-center justify-center rounded-full border " +
              (i <= activeIndex
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground")
            }
          >
            {i + 1}
          </span>
          <span className={i <= activeIndex ? "text-foreground" : "text-muted-foreground"}>
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-muted-foreground mx-1">·</span>}
        </div>
      ))}
    </div>
  );
}

function InputStep({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: AssignmentInput;
  onChange: (v: AssignmentInput) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <Card className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Describe the assignment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We'll generate a tailored review guide. The AI will not solve the task.
          </p>
        </div>

        <Field label="Task title">
          <Input
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. Implement a debounce utility"
          />
        </Field>

        <Field label="Task description">
          <Textarea
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="What is the student building? Inputs, outputs, constraints..."
            rows={5}
          />
        </Field>

        <Field label="Testing criteria">
          <Textarea
            value={value.criteria}
            onChange={(e) => onChange({ ...value, criteria: e.target.value })}
            placeholder="Bullet what the solution must do. One criterion per line."
            rows={5}
          />
        </Field>

        <Field label="Code submission (optional)">
          <Textarea
            value={value.code}
            onChange={(e) => onChange({ ...value, code: e.target.value })}
            placeholder="Paste the submitted code here, if any."
            rows={8}
            className="font-mono text-xs"
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={onSubmit} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating guide…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate review guide
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(MOCK_ASSIGNMENT)}
            disabled={loading}
          >
            Load example
          </Button>
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="p-5">
          <h3 className="font-semibold text-sm">How it works</h3>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Describe the assignment + criteria.</li>
            <li>Get a review guide: checklist, questions, edge cases.</li>
            <li>Write feedback. AI coaches you to make it stronger.</li>
            <li>Generate a learning summary for the submitter.</li>
          </ol>
        </Card>
        <Card className="p-5">
          <Badge variant="secondary" className="mb-2">Mentor, not solver</Badge>
          <p className="text-xs text-muted-foreground">
            The AI never writes the correct solution or the review for you. It nudges
            with questions and highlights what's missing.
          </p>
        </Card>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function GuideStep({
  assignment,
  guide,
  feedback,
  setFeedback,
  analysis,
  onAnalyze,
  loadingAnalyze,
  onBack,
  onContinue,
  loadingSummary,
}: {
  assignment: AssignmentInput;
  guide: ReviewGuide;
  feedback: string;
  setFeedback: (v: string) => void;
  analysis: FeedbackAnalysis | null;
  onAnalyze: () => void;
  loadingAnalyze: boolean;
  onBack: () => void;
  onContinue: () => void;
  loadingSummary: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Edit assignment
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">{assignment.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Use this guide while you review. Then write feedback below — the AI will coach it.
          </p>
        </div>
      </div>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GuideSection title="Review checklist" icon={ListChecks} items={guide.reviewChecklist} />
        <GuideSection title="Guiding questions" icon={HelpCircle} items={guide.guidingQuestions} />
        <GuideSection title="Edge cases" icon={AlertTriangle} items={guide.edgeCases} accent="text-amber-600 dark:text-amber-400" />
        <GuideSection title="Common mistakes" icon={Bug} items={guide.commonMistakes} accent="text-rose-600 dark:text-rose-400" />
        <GuideSection title="Focus areas" icon={Target} items={guide.focusAreas} accent="text-emerald-600 dark:text-emerald-400" />
      </section>

      <section className="grid md:grid-cols-[1fr_340px] gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Your peer feedback</h2>
          </div>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write feedback for the submitter. Be specific, kind, and actionable."
            rows={10}
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={onAnalyze} disabled={loadingAnalyze} variant="secondary" className="gap-2">
              {loadingAnalyze ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Coaching…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Improve my feedback
                </>
              )}
            </Button>
            <Button onClick={onContinue} disabled={loadingSummary || !feedback.trim()} className="gap-2">
              {loadingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Building summary…
                </>
              ) : (
                <>
                  Generate submitter summary
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {analysis ? (
            <>
              <FeedbackMeter scores={analysis.scores} />
              {analysis.suggestions.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-sm font-semibold mb-2">Coaching prompts</h3>
                  <ul className="space-y-2 text-sm">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="rounded-md bg-muted/60 px-3 py-2">
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {analysis.missing.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-sm font-semibold mb-2 text-amber-700 dark:text-amber-400">
                    Likely missing
                  </h3>
                  <ul className="space-y-1.5 text-sm text-foreground/90">
                    {analysis.missing.map((s, i) => (
                      <li key={i}>· {s}</li>
                    ))}
                  </ul>
                </Card>
              )}
              {analysis.strengths.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-400">
                    Strengths
                  </h3>
                  <ul className="space-y-1.5 text-sm text-foreground/90">
                    {analysis.strengths.map((s, i) => (
                      <li key={i}>· {s}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Feedback coach</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Write a draft and tap <em>Improve my feedback</em>. You'll get scores and
                guiding questions — never a rewrite of your review.
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryStep({
  summary,
  onBack,
  onRestart,
}: {
  summary: SubmitterSummary;
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back to feedback
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">Submitter summary</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            A learning-focused recap. Share this with the submitter.
          </p>
        </div>
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RefreshCw className="h-4 w-4" /> New review
        </Button>
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        <GuideSection
          title="Key issues"
          icon={AlertTriangle}
          items={summary.keyIssues}
          accent="text-amber-600 dark:text-amber-400"
        />
        <GuideSection
          title="Learning topics"
          icon={GraduationCap}
          items={summary.learningTopics}
        />
        <GuideSection
          title="Improvement priorities"
          icon={Target}
          items={summary.improvementPriorities}
          accent="text-emerald-600 dark:text-emerald-400"
        />
      </section>
    </div>
  );
}
