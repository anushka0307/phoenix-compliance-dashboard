import { METRIC_DEFINITIONS } from "@/data/metricDefinitions";
import { MetricTooltip } from "@/components/market-analysis/MetricTooltip";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { MetricTrendCard } from "@/components/market-analysis/MetricTrendCard";
import { maGrid } from "@/components/market-analysis/marketAnalysisLayout";
import type { MarketFundamentalsMetrics } from "@/types/marketAnalysis";
import { MEDICARE_ELIGIBILITY_RATE, SERVICE_FIT_SCORE } from "@/utils/marketCalculations";
import { formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface MarketFundamentalsSectionProps {
  fundamentals: MarketFundamentalsMetrics;
}

export function MarketFundamentalsSection({ fundamentals }: MarketFundamentalsSectionProps) {
  const assumptions = fundamentals.addressableAssumptions;

  return (
    <MarketAnalysisSection
      title="Market Fundamentals"
      subtitle="Demographic demand drivers and addressable market sizing"
      emphasis="tertiary"
      compact
    >
      {assumptions && (
        <div
          className="mb-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          title={METRIC_DEFINITIONS.addressablePatients.formula}
        >
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-medium text-foreground">Addressable patients formula</span>
            <MetricTooltip metric={METRIC_DEFINITIONS.addressablePatients} />
          </div>
          <p className="mt-1 font-mono text-[10px] leading-relaxed">
            {formatNumber(assumptions.medicarePopulation)} × {assumptions.eligibilityRate} ×{" "}
            {formatPercent(assumptions.chronicCarePrevalence)} × {assumptions.serviceFitScore} ≈{" "}
            <strong className="text-foreground">{formatNumber(fundamentals.addressablePatients)}</strong>
          </p>
          <p className="mt-1">
            Eligibility {MEDICARE_ELIGIBILITY_RATE * 100}%, service fit {SERVICE_FIT_SCORE * 100}%
          </p>
        </div>
      )}

      <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3", maGrid)}>
        <MetricTrendCard
          label="Medicare Population"
          value={formatNumber(fundamentals.medicarePopulation)}
          trend="Primary payer segment"
          trendDirection={fundamentals.medicareGrowthTrend}
          compact
        />
        <MetricTrendCard
          label="Addressable Patients"
          value={formatNumber(fundamentals.addressablePatients)}
          trend="Derived from Medicare base"
          trendDirection="neutral"
          compact
        />
        <MetricTrendCard
          label="Est. Physician Groups"
          value={formatNumber(fundamentals.estimatedPhysicianGroups)}
          trend="Addressable patients × 10%"
          trendDirection="neutral"
          compact
        />
        <MetricTrendCard
          label="Population Growth Rate"
          value={formatPercent(fundamentals.populationGrowthRate)}
          trend="Year-over-year"
          trendDirection={fundamentals.populationGrowthTrend}
          compact
        />
        <MetricTrendCard
          label="Chronic Disease Prevalence"
          value={formatPercent(fundamentals.chronicDiseasePrevalence)}
          trend="Care complexity factor"
          trendDirection={fundamentals.chronicDiseaseTrend}
          compact
        />
        <MetricTrendCard
          label="Est. Home Health Agencies"
          value={formatNumber(fundamentals.estimatedHomeHealthAgencies)}
          trend="Population × 1%"
          trendDirection="neutral"
          compact
        />
      </div>
    </MarketAnalysisSection>
  );
}
