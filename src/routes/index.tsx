import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  FileCode2,
  Mic,
} from "lucide-react";
import { TopNav } from "@/components/top-nav";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "kood// coach — AI-augmented peer reviews" },
      {
        name: "description",
        content:
          "AI coach for software students. Review guides, code walkthroughs, and call summaries — without solving the assignment.",
      },
    ],
  }),
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-14 md:py-20 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-0.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Mentor, not auto-solver
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
            Peer reviews that actually teach.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Guide a review, explain a snippet, summarize a call — the AI coaches, never solves.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link to="/review">
              <Button size="sm" className="gap-1.5">
                Start a review <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link to="/explain">
              <Button size="sm" variant="outline">
                Explain code
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-3 pb-14">
          <Feature
            icon={BookOpen}
            title="Review guide"
            body="Checklist, guiding questions and edge cases from the task itself."
            to="/review"
          />
          <Feature
            icon={FileCode2}
            title="Explain a snippet"
            body="Walkthrough plus performance, security, and missing edge cases."
            to="/explain"
          />
          <Feature
            icon={Mic}
            title="Call summary"
            body="Transcribe a review call and split it into action items for both sides."
            to="/call"
          />
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-4 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>kood// coach · educational prototype</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquareQuote className="h-3 w-3" /> AI never writes the solution.
          </span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
  to,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
  to: "/review" | "/explain" | "/call";
}) {
  return (
    <Link to={to} className="group">
      <Card className="p-4 h-full transition-colors group-hover:border-primary/40">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="mt-2.5 text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      </Card>
    </Link>
  );
}
