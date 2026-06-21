import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/market-analysis/charts/Sparkline";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { TrendMetric } from "@/types/marketAnalysis";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface TrendAnalysisSectionProps {
  trends: TrendMetric[];
}

function formatTrendValue(metric: TrendMetric, value: number): string {
  if (metric.format === "currency") return formatCurrency(value);
  if (metric.format === "percent") return formatPercent(value);
  return formatNumber(value);
}

export function TrendAnalysisSection({ trends }: TrendAnalysisSectionProps) {
  return (
    <MarketAnalysisSection
      title="Trend Analysis"
      subtitle="Sparklines with YoY direction and prior-quarter comparison"
      emphasis="secondary"
      compact
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {trends.map((metric) => {
          const up = metric.yoyDelta >= 0;
          const Arrow = up ? ArrowUpRight : ArrowDownRight;
          return (
            <article key={metric.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums">
                    {formatTrendValue(metric, metric.currentValue)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
                    up ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  <Arrow className="size-3.5" />
                  {up ? "+" : ""}
                  {metric.yoyDelta}% YoY
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Prior quarter: {formatTrendValue(metric, metric.previousQuarter)}
              </p>
              <div className="mt-2">
                <Sparkline
                  data={metric.monthly}
                  width={320}
                  height={48}
                  strokeClassName={up ? "stroke-emerald-600" : "stroke-red-500"}
                  fillClassName={up ? "fill-emerald-500/10" : "fill-red-500/10"}
                />
              </div>
            </article>
          );
        })}
      </div>
    </MarketAnalysisSection>
  );
}
