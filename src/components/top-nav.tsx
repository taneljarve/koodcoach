import { Link, useLocation } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/review", label: "Review" },
  { to: "/explain", label: "Explain" },
  { to: "/call", label: "Call" },
] as const;

export function TopNav() {
  const { pathname } = useLocation();
  return (
    <header className="border-b border-border/60 sticky top-0 z-40 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span>
            kood<span className="text-primary">//</span> coach
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
