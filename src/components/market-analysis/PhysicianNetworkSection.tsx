import { useState } from "react";
import { ForceDirectedGraph } from "@/components/market-analysis/charts/ForceDirectedGraph";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { MetricTooltip } from "@/components/market-analysis/MetricTooltip";
import { METRIC_DEFINITIONS } from "@/data/metricDefinitions";
import type { PhysicianNetworkIntelligence } from "@/types/marketAnalysis";
import { formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface PhysicianNetworkSectionProps {
  network: PhysicianNetworkIntelligence;
}

export function PhysicianNetworkSection({ network }: PhysicianNetworkSectionProps) {
  const [warmOnly, setWarmOnly] = useState(false);

  return (
    <MarketAnalysisSection
      title="Physician Network Intelligence"
      subtitle="Shared physicians between partner and non-partner PGs = warm acquisition targets"
      emphasis="primary"
      compact
    >
      <div className="mb-2 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={warmOnly}
            onChange={(e) => setWarmOnly(e.target.checked)}
          />
          Warm opportunities only
        </label>
      </div>

      <ForceDirectedGraph
        nodes={network.graphNodes}
        links={network.graphLinks}
        warmOnly={warmOnly}
      />

      <div className={cn("mt-3 grid gap-2 sm:grid-cols-3")}>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Shared physician count</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatNumber(network.sharedPhysicianCount)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Warm introduction score</p>
            <MetricTooltip metric={METRIC_DEFINITIONS.warmIntroductionScore} />
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600">
            {formatPercent(network.warmIntroductionScore)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Referral influence score</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
            {formatPercent(network.referralInfluenceScore)}
          </p>
        </div>
      </div>
    </MarketAnalysisSection>
  );
}
