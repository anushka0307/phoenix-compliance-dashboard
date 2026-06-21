import { InsufficientDataPanel } from "@/components/InsufficientDataPanel";
import { Badge } from "@/components/ui/badge";
import { ExpandableTable } from "@/components/market-analysis/charts/ExpandableTable";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { MetricTooltip } from "@/components/market-analysis/MetricTooltip";
import { METRIC_DEFINITIONS } from "@/data/metricDefinitions";
import type { BusinessAnalytics } from "@/types/marketAnalysis";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface BusinessAnalyticsSectionProps {
  analytics: BusinessAnalytics;
  showAdvancedMetrics?: boolean;
  insufficientLabel?: string;
  insufficientReasons?: string[];
}

export function BusinessAnalyticsSection({
  analytics,
  showAdvancedMetrics = true,
  insufficientLabel,
  insufficientReasons,
}: BusinessAnalyticsSectionProps) {
  const { coverage, market, operational, risk, forecast } = analytics;

  if (!showAdvancedMetrics) {
    return (
      <MarketAnalysisSection
        title="Business Analytics"
        subtitle="Revenue mix and onboarding SLA performance"
        emphasis="tertiary"
        compact
      >
        <InsufficientDataPanel label={insufficientLabel} reasons={insufficientReasons} />
      </MarketAnalysisSection>
    );
  }

  const slaHealthy = operational.slaCompliancePercent >= 85;

  return (
    <MarketAnalysisSection
      title="Business Analytics"
      subtitle="Revenue mix and onboarding SLA performance"
      emphasis="tertiary"
      compact
    >
      <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4")}>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Average onboarding time</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {operational.averageOnboardingDays} days
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">SLA target</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{operational.slaTargetDays} days</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">SLA compliance</p>
            <MetricTooltip metric={METRIC_DEFINITIONS.slaCompliance} />
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatPercent(operational.slaCompliancePercent)}
          </p>
          <Badge variant={slaHealthy ? "secondary" : "destructive"} className="mt-1 text-[10px]">
            {slaHealthy ? "On track" : "Below target"}
          </Badge>
        </div>
        <div
          className="rounded-lg border border-border bg-card p-3"
          title="Percentage of onboarded PGs exceeding the 30-day onboarding target."
        >
          <p className="text-xs text-muted-foreground">PGs breaching SLA</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatNumber(operational.pgsBreachingSla)} / {formatNumber(operational.totalTrackedPgs)}
            <span className="ml-1 text-sm font-medium text-red-600">
              ({formatPercent(operational.breachPercent)})
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <ExpandableTable
          title="Coverage & market metrics"
          headers={["Metric", "Value"]}
          rows={[
            ["Addressable patient ratio", formatPercent(coverage.addressablePatientRatio)],
            ["Patient acquisition efficiency", formatPercent(coverage.patientAcquisitionEfficiency)],
            ["Revenue per ZIP", formatCurrency(coverage.revenuePerZip)],
            ["CAGR", formatPercent(market.cagr)],
            ["Referral leakage", formatPercent(market.referralLeakagePercent)],
            ["White-space score", formatPercent(market.whitespaceScore)],
          ]}
        />
        <ExpandableTable
          title="Risk & forecast metrics"
          headers={["Metric", "Value"]}
          rows={[
            ["Client concentration risk", formatPercent(risk.clientConcentrationRisk)],
            ["County dependency index", formatPercent(risk.countyDependencyIndex)],
            ["Projected TAM (3yr)", formatCurrency(forecast.projectedTam3yr)],
            ["Scenario sensitivity", formatPercent(forecast.scenarioSensitivity)],
          ]}
        />
      </div>
    </MarketAnalysisSection>
  );
}
