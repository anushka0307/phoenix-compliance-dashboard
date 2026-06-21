import { CountyCoverageStackedBar } from "@/components/market-analysis/charts/CountyCoverageStackedBar";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { CountyCoverageRow } from "@/types/marketAnalysis";

interface CoverageAnalysisSectionProps {
  countyGaps: CountyCoverageRow[];
  penetrationTarget: number;
}

export function CoverageAnalysisSection({
  countyGaps,
  penetrationTarget: _penetrationTarget,
}: CoverageAnalysisSectionProps) {
  return (
    <MarketAnalysisSection
      title="Coverage Analysis"
      subtitle="Which counties have the largest referral coverage gaps?"
      emphasis="tertiary"
      compact
    >
      <CountyCoverageStackedBar counties={countyGaps} />
    </MarketAnalysisSection>
  );
}
