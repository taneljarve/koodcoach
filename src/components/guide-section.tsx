import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function GuideSection({
  title,
  icon: Icon,
  items,
  accent = "text-primary",
  empty,
}: {
  title: string;
  icon: LucideIcon;
  items: string[] | undefined;
  accent?: string;
  empty?: string;
}) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted", accent)}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-2 text-sm text-foreground/90">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground select-none">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty ?? "No items."}</p>
      )}
    </Card>
  );
}
