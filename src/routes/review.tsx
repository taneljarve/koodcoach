import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  MessageSquareQuote,
  Target,
  AlertTriangle,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { GuideSection } from "@/components/guide-section";
import { FeedbackMeter } from "@/components/feedback-meter";
import { ListChecks, HelpCircle, Bug } from "lucide-react";
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
      { title: "Start a review — kood// coach" },
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
      toast.error("Fill title, description, and testing criteria.");
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
      setGuide((await res.json()) as ReviewGuide);
      setAnalysis(null);
      setSummary(null);
      setFeedback("");
      setStep("guide");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingGuide(false);
    }
  }

  async function analyzeFeedback() {
    if (feedback.trim().length < 5) {
      toast.error("Write a sentence first.");
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
        throw new Error(error || "Failed to analyze");
      }
      setAnalysis((await res.json()) as FeedbackAnalysis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
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
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingSummary(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors closeButton />
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-5 space-y-5">
        <Stepper step={step} />
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
    <div className="flex items-center gap-2 text-[11px]">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <span
            className={
              "inline-flex h-5 w-5 items-center justify-center rounded-full border " +
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
          {i < steps.length - 1 && <span className="text-muted-foreground">·</span>}
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
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Describe the assignment</h1>
          <p className="text-xs text-muted-foreground">AI generates a review guide. It won't solve the task.</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">Mentor, not solver</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Task title">
          <Input
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. Implement a debounce utility"
            className="h-8 text-xs"
          />
        </Field>
        <Field label="Testing criteria">
          <Textarea
            value={value.criteria}
            onChange={(e) => onChange({ ...value, criteria: e.target.value })}
            placeholder="One criterion per line."
            rows={3}
            className="text-xs"
          />
        </Field>
        <Field label="Task description">
          <Textarea
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="What is the student building?"
            rows={5}
            className="text-xs"
          />
        </Field>
        <Field label="Code submission (optional)">
          <Textarea
            value={value.code}
            onChange={(e) => onChange({ ...value, code: e.target.value })}
            placeholder="Paste submitted code."
            rows={5}
            className="font-mono text-xs"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSubmit} disabled={loading} size="sm" className="gap-2">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> Generate review guide
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(MOCK_ASSIGNMENT)}
          disabled={loading}
        >
          Load example
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2 h-7 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Edit assignment
          </Button>
          <h1 className="text-lg font-semibold tracking-tight mt-1">{assignment.title}</h1>
        </div>
      </div>

      <Card className="p-3">
        <Tabs defaultValue="checklist">
          <TabsList className="h-8">
            <TabsTrigger value="checklist" className="text-xs gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Checklist
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" /> Questions
            </TabsTrigger>
            <TabsTrigger value="edges" className="text-xs gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Edge cases
            </TabsTrigger>
            <TabsTrigger value="mistakes" className="text-xs gap-1.5">
              <Bug className="h-3.5 w-3.5" /> Mistakes
            </TabsTrigger>
            <TabsTrigger value="focus" className="text-xs gap-1.5">
              <Target className="h-3.5 w-3.5" /> Focus
            </TabsTrigger>
          </TabsList>
          <TabsContent value="checklist" className="pt-3">
            <SimpleList items={guide.reviewChecklist} />
          </TabsContent>
          <TabsContent value="questions" className="pt-3">
            <SimpleList items={guide.guidingQuestions} />
          </TabsContent>
          <TabsContent value="edges" className="pt-3">
            <SimpleList items={guide.edgeCases} accent="text-amber-400" />
          </TabsContent>
          <TabsContent value="mistakes" className="pt-3">
            <SimpleList items={guide.commonMistakes} accent="text-rose-400" />
          </TabsContent>
          <TabsContent value="focus" className="pt-3">
            <SimpleList items={guide.focusAreas} accent="text-emerald-400" />
          </TabsContent>
        </Tabs>
      </Card>

      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-sm font-semibold">Your peer feedback</h2>
          </div>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Be specific, kind, and actionable."
            rows={8}
            className="text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={onAnalyze} disabled={loadingAnalyze} variant="secondary" size="sm" className="gap-2">
              {loadingAnalyze ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Coaching…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Improve my feedback
                </>
              )}
            </Button>
            <Button onClick={onContinue} disabled={loadingSummary || !feedback.trim()} size="sm" className="gap-2">
              {loadingSummary ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building…
                </>
              ) : (
                <>Submitter summary</>
              )}
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {analysis ? (
            <>
              <FeedbackMeter scores={analysis.scores} />
              <Card className="p-2">
                <Accordion type="multiple" defaultValue={["suggestions"]}>
                  {analysis.suggestions.length > 0 && (
                    <AccordionItem value="suggestions" className="border-0">
                      <AccordionTrigger className="text-xs py-2 px-2 hover:no-underline">
                        Coaching prompts ({analysis.suggestions.length})
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <ul className="space-y-1.5 text-sm">
                          {analysis.suggestions.map((s, i) => (
                            <li key={i} className="rounded bg-muted/60 px-2 py-1.5">{s}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {analysis.missing.length > 0 && (
                    <AccordionItem value="missing" className="border-0">
                      <AccordionTrigger className="text-xs py-2 px-2 hover:no-underline text-amber-400">
                        Likely missing ({analysis.missing.length})
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <SimpleList items={analysis.missing} />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {analysis.strengths.length > 0 && (
                    <AccordionItem value="strengths" className="border-0">
                      <AccordionTrigger className="text-xs py-2 px-2 hover:no-underline text-emerald-400">
                        Strengths ({analysis.strengths.length})
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <SimpleList items={analysis.strengths} />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </Card>
            </>
          ) : (
            <Card className="p-3">
              <h3 className="text-xs font-semibold">Feedback coach</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Write a draft and tap <em>Improve my feedback</em>. You'll get scores and guiding questions — never a rewrite.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleList({ items, accent = "" }: { items: string[]; accent?: string }) {
  if (!items?.length) return <p className="text-xs text-muted-foreground">No items.</p>;
  return (
    <ul className="space-y-1.5 text-sm text-foreground/90">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className={`select-none ${accent || "text-muted-foreground"}`}>·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2 h-7 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <h1 className="text-lg font-semibold tracking-tight mt-1">Submitter summary</h1>
        </div>
        <Button variant="outline" size="sm" onClick={onRestart} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> New review
        </Button>
      </div>

      <section className="grid md:grid-cols-3 gap-3">
        <GuideSection title="Key issues" icon={AlertTriangle} items={summary.keyIssues} accent="text-amber-400" />
        <GuideSection title="Learning topics" icon={GraduationCap} items={summary.learningTopics} />
        <GuideSection
          title="Improvement priorities"
          icon={Target}
          items={summary.improvementPriorities}
          accent="text-emerald-400"
        />
      </section>
    </div>
  );
}
