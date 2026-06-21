import {
  BarChart3,
  Gauge,
  LineChart,
  PieChart,
  Target,
  Trophy,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { maGrid } from "@/components/market-analysis/marketAnalysisLayout";
import type { MarketAnalysisExecutiveKpis } from "@/types/marketAnalysis";
import { formatCurrency, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface ExecutiveSnapshotSectionProps {
  kpis: MarketAnalysisExecutiveKpis;
}

export function ExecutiveSnapshotSection({ kpis }: ExecutiveSnapshotSectionProps) {
  return (
    <MarketAnalysisSection
      title="Executive Snapshot"
      subtitle="How attractive is this market?"
      emphasis="secondary"
    >
      <div className={cn("grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", maGrid)}>
        <KpiCard
          label="Market Opportunity Score"
          value={String(kpis.marketOpportunityScore)}
          subtext="Composite index"
          icon={Target}
          className="shadow-none"
        />
        <KpiCard
          label="Total Addressable Market"
          value={formatCurrency(kpis.totalAddressableMarket)}
          subtext="Annual TAM"
          icon={PieChart}
          className="shadow-none"
        />
        <KpiCard
          label="Patient Reach"
          value={formatPercent(kpis.currentMarketPenetration)}
          subtext="Capped at PG penetration"
          icon={Gauge}
          className="shadow-none"
        />
        <KpiCard
          label="PG Penetration"
          value={formatPercent(kpis.pgCoverage)}
          subtext="Partner PGs ÷ addressable PGs"
          icon={BarChart3}
          className="shadow-none"
        />
        <KpiCard
          label="HHA Coverage"
          value={formatPercent(kpis.hhaCoverage)}
          subtext="Partner ÷ total HHAs"
          icon={BarChart3}
          className="shadow-none"
        />
        <KpiCard
          label="Revenue per Patient"
          value={kpis.revenuePerPatient > 0 ? formatCurrency(kpis.revenuePerPatient) : "—"}
          subtext="Revenue ÷ active patients"
          icon={LineChart}
          className="shadow-none"
        />
        <KpiCard
          label="Annual Growth Rate"
          value={formatPercent(kpis.annualGrowthRate)}
          subtext="Population growth"
          icon={LineChart}
          trend="up"
          className="shadow-none"
        />
        <KpiCard
          label="Network Rank"
          value={`#${kpis.networkRank}`}
          subtext={`of ${kpis.networkTotal} markets`}
          icon={Trophy}
          className="shadow-none"
        />
      </div>
    </MarketAnalysisSection>
  );
}
