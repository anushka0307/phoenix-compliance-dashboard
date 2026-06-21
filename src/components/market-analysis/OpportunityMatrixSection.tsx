import { BubbleMatrix } from "@/components/market-analysis/charts/BubbleMatrix";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { ScoredOpportunity } from "@/types/marketAnalysis";

interface OpportunityMatrixSectionProps {
  opportunities: ScoredOpportunity[];
}

export function OpportunityMatrixSection({ opportunities }: OpportunityMatrixSectionProps) {
  const bubbles = opportunities.map((item) => ({
    id: item.id,
    label: item.name,
    effort: item.effortScore,
    impact: item.revenueScore,
    size: item.estimatedRevenueImpact,
    priorityScore: item.score,
  }));

  return (
    <MarketAnalysisSection
      title="Opportunity Prioritization Matrix"
      subtitle="Effort vs revenue impact — bubble size = opportunity value, color = priority"
      emphasis="secondary"
      compact
    >
      <BubbleMatrix bubbles={bubbles} />
    </MarketAnalysisSection>
  );
}
