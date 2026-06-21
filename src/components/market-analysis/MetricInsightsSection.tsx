import { TrendingUp } from "lucide-react";
import type { MetricDrivenInsight } from "@/types/marketAnalysis";

interface MetricInsightsSectionProps {
  insights: MetricDrivenInsight;
}

export function MetricInsightsSection({ insights }: MetricInsightsSectionProps) {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-4" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Market Intelligence
          </p>
          <p className="text-sm font-semibold text-foreground">{insights.headline}</p>
          <ul className="space-y-1">
            {insights.bullets.map((bullet) => (
              <li key={bullet} className="text-xs leading-relaxed text-muted-foreground">
                • {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
