import { BarChart3, LineChart, Target } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { METRIC_DEFINITIONS } from "@/data/metricDefinitions";
import { MetricTooltip } from "@/components/market-analysis/MetricTooltip";
import { maGrid } from "@/components/market-analysis/marketAnalysisLayout";
import type { ExecutiveSummary } from "@/types/marketAnalysis";
import { formatCurrency, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface ExecutiveSummarySectionProps {
  summary: ExecutiveSummary;
}

export function ExecutiveSummarySection({ summary }: ExecutiveSummarySectionProps) {
  return (
    <MarketAnalysisSection
      title="Executive Summary"
      subtitle="Market attractiveness — core KPIs shown above"
      emphasis="secondary"
      compact
    >
      <div className={cn("grid sm:grid-cols-3", maGrid)}>
        <KpiCard
          label="Total Addressable Market"
          value={formatCurrency(summary.totalAddressableMarket)}
          subtext="Annual TAM"
          icon={Target}
          className="shadow-none"
        />
        <KpiCard
          label="Annual Growth Rate"
          value={formatPercent(summary.annualGrowthRate)}
          subtext="Population CAGR"
          icon={LineChart}
          trend="up"
          className="shadow-none"
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground">Competitive Intensity</p>
            <MetricTooltip metric={METRIC_DEFINITIONS.hhi} />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            <p className="text-xl font-semibold tabular-nums">{summary.competitiveIntensity}/10</p>
          </div>
        </div>
      </div>
    </MarketAnalysisSection>
  );
}
