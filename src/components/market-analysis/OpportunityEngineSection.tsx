import { Badge } from "@/components/ui/badge";
import {
  MarketAnalysisAccordion,
  MarketAnalysisSection,
} from "@/components/market-analysis/MarketAnalysisSection";
import type { ScoredOpportunity } from "@/types/marketAnalysis";
import { formatCurrency } from "@/utils/format";

interface OpportunityEngineSectionProps {
  opportunityScore: number;
  opportunities: ScoredOpportunity[];
}

const priorityVariant = {
  Critical: "destructive",
  High: "warning",
  Medium: "secondary",
  Low: "outline",
} as const;

export function OpportunityEngineSection({
  opportunityScore,
  opportunities,
}: OpportunityEngineSectionProps) {
  const topOpportunity = opportunities[0];

  return (
    <MarketAnalysisSection
      title="Opportunity Engine"
      subtitle="Ranked expansion paths by impact"
      emphasis="secondary"
      compact
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-card px-4 py-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Composite Opportunity Score</p>
          <p className="text-3xl font-semibold tracking-tight text-primary tabular-nums">
            {opportunityScore}
          </p>
        </div>
        {topOpportunity && (
          <div className="sm:text-right">
            <p className="text-xs font-medium text-muted-foreground">Top opportunity</p>
            <p className="text-sm font-semibold text-foreground">{topOpportunity.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(topOpportunity.estimatedRevenueImpact)} impact
            </p>
          </div>
        )}
      </div>

      <MarketAnalysisAccordion
        title="All ranked opportunities"
        description="Sorted by score — market size, growth, density, and competition"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Opportunity</th>
                <th className="pb-2 pr-4 font-medium">Score</th>
                <th className="pb-2 pr-4 font-medium">Revenue Impact</th>
                <th className="pb-2 pr-4 font-medium">Effort</th>
                <th className="pb-2 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-foreground">{item.name}</td>
                  <td className="py-2.5 pr-4 font-semibold tabular-nums">{item.score}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">
                    {formatCurrency(item.estimatedRevenueImpact)}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{item.effortLevel}</td>
                  <td className="py-2.5">
                    <Badge variant={priorityVariant[item.priority]}>{item.priority}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketAnalysisAccordion>
    </MarketAnalysisSection>
  );
}
