import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Mic,
  Square,
  Loader2,
  Sparkles,
  ListChecks,
  Lightbulb,
  HelpCircle,
  User,
  UserCheck,
} from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { FeedbackMeter } from "@/components/feedback-meter";
import type { CallSummary } from "@/lib/review-types";

export const Route = createFileRoute("/call")({
  component: CallPage,
  head: () => ({
    meta: [
      { title: "Review call recorder — kood// coach" },
      {
        name: "description",
        content:
          "Live-transcribe a peer-review call in the browser and turn it into a coaching summary for both sides.",
      },
    ],
  }),
});

// Minimal Web Speech API typing
type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MOCK_TRANSCRIPT = `Reviewer: Hey, I looked at your debounce function. It mostly works but I noticed a few things.
Submitter: Cool, what did you find?
Reviewer: First, when you clearTimeout, you don't reset t to undefined, so cancel after a fire is a no-op which is fine but it's a code smell.
Submitter: Got it. What else?
Reviewer: The bigger thing is 'this' binding. You use an arrow function so the caller's this is lost. If someone does obj.method = debounce(obj.method, 200), it won't work.
Submitter: Oh interesting, I didn't test that. Should I use a regular function?
Reviewer: Yeah — and forward arguments explicitly. Also think about what happens if wait is zero or negative.
Submitter: Okay. So I should add this binding, handle wait edge cases, and maybe a test for cancel after the call has fired.
Reviewer: Exactly. Don't worry about implementing it now, just make sure your next pass covers these.`;

function CallPage() {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const recRef = useRef<SR | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(!!getSpeechRecognition());
    return () => {
      recRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function start() {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error("Speech recognition not supported. Try Chrome or Edge.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (ev) => {
      let inter = "";
      let finals = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const text = r[0].transcript;
        if (r.isFinal) finals += text + " ";
        else inter += text;
      }
      if (finals) setTranscript((t) => (t + finals).slice(0, 30000));
      setInterim(inter);
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        toast.error("Microphone permission denied.");
        stop();
      }
    };
    rec.onend = () => {
      // auto-restart while user wants recording (some browsers auto-end)
      if (recording) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      }
    };
    try {
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      toast.error("Could not start recording.");
    }
  }

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
    setInterim("");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function summarize() {
    const text = transcript.trim();
    if (text.length < 20) {
      toast.error("Need more transcript first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/summarize-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error || "Failed to summarize");
      }
      setSummary((await res.json()) as CallSummary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors closeButton />
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Review call recorder</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Live in-browser transcription. Nothing leaves your device until you summarize.
          </p>
        </div>

        {!supported && (
          <Card className="p-3 text-xs border-amber-500/40">
            Your browser doesn't support live speech recognition. Use Chrome or Edge, or paste a
            transcript below.
          </Card>
        )}

        <div className="grid md:grid-cols-[1fr_300px] gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {recording ? (
                  <Badge className="gap-1.5 bg-rose-500/20 text-rose-300 border-rose-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                    REC
                  </Badge>
                ) : (
                  <Badge variant="secondary">Idle</Badge>
                )}
                <span className="text-xs font-mono text-muted-foreground">
                  {mm}:{ss}
                </span>
              </div>
              <div className="flex gap-2">
                {!recording ? (
                  <Button size="sm" onClick={start} disabled={!supported} className="gap-1.5">
                    <Mic className="h-3.5 w-3.5" /> Start
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={stop} className="gap-1.5">
                    <Square className="h-3.5 w-3.5" /> Stop
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              value={transcript + (interim ? " " + interim : "")}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Transcript appears here as you speak. You can also paste one manually."
              rows={14}
              className="text-sm"
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={summarize} disabled={loading || !transcript.trim()} size="sm" className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Summarizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Summarize call
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTranscript(MOCK_TRANSCRIPT)}
                disabled={recording}
              >
                Load example
              </Button>
              {transcript && !recording && (
                <Button size="sm" variant="ghost" onClick={() => setTranscript("")}>
                  Clear
                </Button>
              )}
            </div>
          </Card>

          <aside className="space-y-3">
            <Card className="p-4 text-xs space-y-2">
              <div className="font-semibold text-sm">How it works</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Hit Start, talk through the review.</li>
                <li>Browser transcribes locally in real time.</li>
                <li>Stop and Summarize for two coaching views.</li>
              </ol>
            </Card>
            <Card className="p-4 text-xs">
              <Badge variant="secondary" className="mb-1.5">Mentor, not solver</Badge>
              <p className="text-muted-foreground">
                The summary won't reproduce fixed code — only learning takeaways.
              </p>
            </Card>
          </aside>
        </div>

        {summary && <SummaryView summary={summary} />}
      </main>
    </div>
  );
}

function SummaryView({ summary }: { summary: CallSummary }) {
  const submitterTasks = summary.actionItems?.filter((a) => a.owner === "submitter") ?? [];
  const reviewerTasks = summary.actionItems?.filter((a) => a.owner === "reviewer") ?? [];

  return (
    <section className="space-y-4 pt-2">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-sm font-semibold">TL;DR</h2>
        </div>
        <ul className="space-y-1.5 text-sm">
          {summary.tlDr?.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-semibold">For the submitter</h3>
          </div>
          <TaskList tasks={submitterTasks} empty="No action items for submitter." />
          {summary.learningMoments?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mt-2 mb-1">Study next</div>
              <div className="flex flex-wrap gap-1.5">
                {summary.learningMoments.map((m, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-semibold">For the reviewer</h3>
          </div>
          <TaskList tasks={reviewerTasks} empty="No action items for reviewer." />
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {summary.decisions?.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold">Decisions</h3>
            </div>
            <ul className="space-y-1.5 text-sm">
              {summary.decisions.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {summary.openQuestions?.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <h3 className="text-sm font-semibold">Open questions</h3>
            </div>
            <ul className="space-y-1.5 text-sm">
              {summary.openQuestions.map((q, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {summary.feedbackQuality && <FeedbackMeter scores={summary.feedbackQuality} />}
    </section>
  );
}

function TaskList({
  tasks,
  empty,
}: {
  tasks: CallSummary["actionItems"];
  empty: string;
}) {
  if (!tasks?.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2 text-sm">
      {tasks.map((a, i) => (
        <li key={i} className="rounded-md bg-muted/40 px-2.5 py-2">
          <div className="text-foreground/90">{a.task}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Why: {a.why}</div>
        </li>
      ))}
    </ul>
  );
}
