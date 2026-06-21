import { Badge } from "@/components/ui/badge";
import { DonutChart } from "@/components/market-analysis/charts/DonutTreemap";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { CompetitiveMetrics } from "@/types/marketAnalysis";
import { formatNumber, formatPercent } from "@/utils/format";

interface CompetitiveLandscapeSectionProps {
  metrics: CompetitiveMetrics;
}

const strengthVariant = {
  High: "destructive",
  Medium: "warning",
  Low: "secondary",
} as const;

export function CompetitiveLandscapeSection({ metrics }: CompetitiveLandscapeSectionProps) {
  const segments = metrics.competitors.map((c) => ({
    id: c.name,
    label: c.name,
    value: c.estimatedShare,
  }));

  return (
    <MarketAnalysisSection
      title="Competitive Intelligence"
      subtitle="Market share distribution by competitor"
      emphasis="tertiary"
      compact
    >
      <DonutChart segments={segments} />

      <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">
          Competitor detail breakdown ({metrics.competitors.length})
        </p>
        {metrics.competitors.map((competitor) => (
          <div
            key={competitor.name}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="font-medium">{competitor.name}</span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{formatPercent(competitor.estimatedShare)} share</span>
              <span>{formatPercent(competitor.growthRate)} growth</span>
              <span>{formatNumber(competitor.estimatedPgCount)} PGs</span>
              <span>{competitor.countiesServed} counties</span>
              {competitor.serviceLineStrengths.map((line) => (
                <Badge key={line} variant="outline" className="text-[10px]">
                  {line}
                </Badge>
              ))}
              <Badge variant={strengthVariant[competitor.strength]}>{competitor.strength}</Badge>
            </div>
          </div>
        ))}
      </div>
    </MarketAnalysisSection>
  );
}
