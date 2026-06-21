import { CountyCoverageTable } from "@/components/market-analysis/charts/CountyCoverageTable";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { CoverageIntelligence } from "@/types/marketAnalysis";

interface CoverageIntelligenceSectionProps {
  data: CoverageIntelligence;
}

export function CoverageIntelligenceSection({ data }: CoverageIntelligenceSectionProps) {
  return (
    <MarketAnalysisSection
      title="Coverage Intelligence"
      subtitle="Ranked county coverage gaps sorted by opportunity"
      emphasis="secondary"
      compact
    >
      <CountyCoverageTable counties={data.countyGaps} />
    </MarketAnalysisSection>
  );
}
