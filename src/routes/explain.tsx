import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Zap,
  Shield,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  FileCode2,
} from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { MOCK_SNIPPET, type ExplainResult } from "@/lib/review-types";

export const Route = createFileRoute("/explain")({
  component: ExplainPage,
  head: () => ({
    meta: [
      { title: "Explain code — kood// coach" },
      {
        name: "description",
        content:
          "Paste a snippet and get a plain-English walkthrough plus performance, security and edge-case flags. Never a rewrite.",
      },
    ],
  }),
});

function ExplainPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (code.trim().length < 5) {
      toast.error("Paste a code snippet first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: language || undefined, question: question || undefined }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error || "Failed to explain code");
      }
      setResult((await res.json()) as ExplainResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to explain code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors closeButton />
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Explain a snippet</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Walkthrough, performance, security, and missing edge cases. Never a rewrite.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_360px] gap-4">
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Language (optional)</Label>
                <Input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="ts, python, go…"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">What confuses you? (optional)</Label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. why the await here?"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Code</Label>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste a code snippet…"
                rows={14}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={run} disabled={loading} size="sm" className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Explain
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCode(MOCK_SNIPPET);
                  setLanguage("js");
                }}
                disabled={loading}
              >
                Load example
              </Button>
            </div>
          </Card>

          <aside className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary">Mentor, not solver</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                You'll get an explanation and concerns to investigate — not corrected code.
              </p>
            </Card>
          </aside>
        </div>

        {result && <ResultPanel result={result} />}
      </main>
    </div>
  );
}

function ResultPanel({ result }: { result: ExplainResult }) {
  return (
    <section className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <FileCode2 className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-sm font-semibold">Summary</h2>
        </div>
        <p className="text-sm text-foreground/90">{result.summary}</p>
      </Card>

      {result.lineByLine?.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">Walkthrough</h2>
          <ol className="space-y-2.5">
            {result.lineByLine.map((s, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr] gap-3 text-sm">
                <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-primary font-mono h-fit">
                  {s.range}
                </code>
                <div>
                  <div className="text-foreground/90">{s.what}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Why: {s.why}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <ListCard
          title="Performance"
          icon={Zap}
          items={result.performance}
          accent="text-amber-400"
          empty="No notable performance concerns."
        />
        <ListCard
          title="Security"
          icon={Shield}
          items={result.security}
          accent="text-rose-400"
          empty="No notable security concerns."
        />
        <ListCard
          title="Missing edge cases"
          icon={AlertTriangle}
          items={result.missingEdgeCases}
          accent="text-amber-400"
          empty="Looks well-guarded."
        />
        <ListCard
          title="Ask the author"
          icon={HelpCircle}
          items={result.questionsToAskAuthor}
          accent="text-primary"
        />
      </div>

      {result.concepts?.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-sm font-semibold">Concepts to study</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {result.concepts.map((c, i) => (
              <li key={i} className="rounded-md border border-border/60 p-2.5">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.whyItMatters}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function ListCard({
  title,
  icon: Icon,
  items,
  accent,
  empty,
}: {
  title: string;
  icon: typeof Zap;
  items: string[];
  accent: string;
  empty?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-foreground/90">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground">·</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{empty ?? "None."}</p>
      )}
    </Card>
  );
}
