import { Card, CardContent } from "@/components/ui/card";
import { SankeyDiagram } from "@/components/market-analysis/charts/SankeyDiagram";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { ReferralNetworkIntelligence } from "@/types/marketAnalysis";
import { formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface ReferralNetworkSectionProps {
  network: ReferralNetworkIntelligence;
}

export function ReferralNetworkSection({ network }: ReferralNetworkSectionProps) {
  return (
    <MarketAnalysisSection
      title="Referral Network Intelligence"
      subtitle="PG → HHA → County referral flow"
      emphasis="secondary"
      compact
    >
      <SankeyDiagram nodes={network.sankeyNodes} links={network.sankeyLinks} />

      <div className={cn("mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4")}>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Connected counties</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{network.connectedCounties}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Adjacent expansion</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{network.adjacentExpansionCounties}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Client overlap</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatPercent(network.clientOverlapPercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Referral flow volume</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(network.referralFlowVolume)}
            </p>
          </CardContent>
        </Card>
      </div>
    </MarketAnalysisSection>
  );
}
