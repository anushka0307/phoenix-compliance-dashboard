import { Card, CardContent } from "@/components/ui/card";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { ProgressMetricCard } from "@/components/market-analysis/ProgressMetricCard";
import { maGrid } from "@/components/market-analysis/marketAnalysisLayout";
import type { ProviderLandscapeMetrics } from "@/types/marketAnalysis";
import { formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface ProviderLandscapeSectionProps {
  metrics: ProviderLandscapeMetrics;
}

export function ProviderLandscapeSection({ metrics }: ProviderLandscapeSectionProps) {
  return (
    <MarketAnalysisSection
      title="Provider Landscape"
      subtitle="Partner coverage and capacity"
      emphasis="tertiary"
      compact
    >
      <div className={cn("grid sm:grid-cols-2", maGrid)}>
        <ProgressMetricCard
          label="Physician Groups"
          active={metrics.activePhysicianGroups}
          total={metrics.totalPhysicianGroups}
          formatValue={formatNumber}
        />
        <ProgressMetricCard
          label="Home Health Agencies"
          active={metrics.activeHomeHealthAgencies}
          total={metrics.totalHomeHealthAgencies}
          formatValue={formatNumber}
        />
      </div>

      <div className={cn("grid sm:grid-cols-2 lg:grid-cols-4", maGrid)}>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">PG Coverage</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatPercent(metrics.pgCoverage)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">HHA Coverage</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatPercent(metrics.hhaCoverage)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">HHA-to-PG Ratio</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{metrics.hhaToPgRatio}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Avg Patients per PG</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(metrics.averagePatientsPerPg)}
            </p>
          </CardContent>
        </Card>
      </div>
    </MarketAnalysisSection>
  );
}
