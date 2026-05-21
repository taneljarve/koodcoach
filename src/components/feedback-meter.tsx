import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

type Scores = {
  specificity: number;
  constructiveness: number;
  actionability: number;
};

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-sm font-semibold ${scoreColor(value)}`}>{value}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

export function FeedbackMeter({ scores }: { scores: Scores }) {
  return (
    <Card className="p-5 space-y-4">
      <h3 className="text-base font-semibold">Feedback quality</h3>
      <Row label="Specificity" value={scores.specificity} />
      <Row label="Constructiveness" value={scores.constructiveness} />
      <Row label="Actionability" value={scores.actionability} />
    </Card>
  );
}
