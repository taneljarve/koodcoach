import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, MessageSquareQuote, Sparkles, ArrowRight, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "AI-Augmented Peer Reviews — Learn to give better feedback" },
      {
        name: "description",
        content:
          "An AI coach for software students. Generates review guides, sharpens peer feedback, and turns critique into learning — without solving the assignment.",
      },
    ],
  }),
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>kood<span className="text-primary">//</span> coach</span>
          </Link>
          <Link to="/review">
            <Button size="sm">Start review</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 md:py-28 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI mentor, not auto-solver
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight">
            Peer reviews that actually teach.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Paste an assignment. Get a tailored review guide — checklist, guiding questions,
            edge cases, and learning prompts. Then write feedback while AI coaches you to
            make it sharper, kinder, and more actionable.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/review">
              <Button size="lg" className="gap-2">
                Start a review <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 pb-20">
          <Feature
            icon={BookOpen}
            title="Review guide, on demand"
            body="Checklist, guiding questions, edge cases, and common mistakes — generated from the task itself."
          />
          <Feature
            icon={MessageSquareQuote}
            title="Coaches your feedback"
            body="Scores your draft on specificity, constructiveness, and actionability. Suggests questions, never rewrites."
          />
          <Feature
            icon={GraduationCap}
            title="Turns critique into learning"
            body="Summarizes the review for the submitter as key issues, topics to study, and improvement priorities."
          />
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>PeerCoach · educational prototype</span>
          <span>The AI never writes the solution.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}
