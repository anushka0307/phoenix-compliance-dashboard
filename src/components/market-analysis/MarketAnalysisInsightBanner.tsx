import { Sparkles } from "lucide-react";
import type { MarketAnalysisInsight } from "@/types/marketAnalysis";
import { cn } from "@/utils/cn";

const severityOrder = { high: 0, medium: 1, low: 2 } as const;

const severityStyles = {
  high: "border-amber-200/80 bg-amber-50/60",
  medium: "border-border bg-muted/30",
  low: "border-emerald-200/60 bg-emerald-50/40",
} as const;

interface MarketAnalysisInsightBannerProps {
  insights: MarketAnalysisInsight[];
}

export function MarketAnalysisInsightBanner({ insights }: MarketAnalysisInsightBannerProps) {
  if (insights.length === 0) return null;

  const sorted = [...insights].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
  const [primary, ...secondary] = sorted;

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        severityStyles[primary.severity],
      )}
      role="status"
    >
      <div className="flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            AI Market Insight
          </p>
          <p className="text-sm font-semibold leading-snug text-foreground">{primary.message}</p>
          {secondary.length > 0 && (
            <ul className="space-y-1 border-t border-border/60 pt-2">
              {secondary.map((insight) => (
                <li
                  key={insight.id}
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {insight.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
