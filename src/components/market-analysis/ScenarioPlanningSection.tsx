import { useMemo, useState } from "react";
import { WaterfallChart } from "@/components/market-analysis/charts/WaterfallChart";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { ScenarioBaseline } from "@/types/marketAnalysis";
import { clampPercent } from "@/utils/marketCalculations";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

interface ScenarioPlanningSectionProps {
  baseline: ScenarioBaseline;
}

export function ScenarioPlanningSection({ baseline }: ScenarioPlanningSectionProps) {
  const [pgConversionBoost, setPgConversionBoost] = useState(5);
  const [addedHhas, setAddedHhas] = useState(2);
  const [onboardingReduction, setOnboardingReduction] = useState(7);

  const projection = useMemo(() => {
    const conversionFactor = 1 + pgConversionBoost / 100;
    const patientGain = Math.round(baseline.patients * (conversionFactor - 1) * 0.6);
    const revenueGain = Math.round(
      baseline.revenue * (conversionFactor - 1) * 0.55 + addedHhas * 85_000,
    );
    const onboardingGain = Math.round(onboardingReduction * 12_000);
    const reachGain = clampPercent(
      Math.min(
        baseline.pgPenetration,
        baseline.patientReach + pgConversionBoost * 0.35 + addedHhas * 0.4,
      ),
    );
    const scoreGain = Math.round(
      pgConversionBoost * 0.4 + addedHhas * 1.2 + onboardingReduction * 0.3,
    );

    return {
      revenue: baseline.revenue + revenueGain + onboardingGain,
      revenueDelta: revenueGain,
      onboardingGain,
      patients: baseline.patients + patientGain,
      patientDelta: patientGain,
      patientReach: reachGain,
      opportunityScore: Math.min(100, baseline.opportunityScore + scoreGain),
    };
  }, [baseline, pgConversionBoost, addedHhas, onboardingReduction]);

  const waterfallSteps = useMemo(
    () => [
      { id: "baseline", label: "Baseline", value: baseline.revenue, type: "baseline" as const },
      { id: "pg", label: "PG conv.", value: projection.revenueDelta, type: "delta" as const },
      { id: "hha", label: "HHA adds", value: addedHhas * 85_000, type: "delta" as const },
      {
        id: "onboard",
        label: "Onboarding",
        value: projection.onboardingGain,
        type: "delta" as const,
      },
      { id: "total", label: "Projected", value: projection.revenue, type: "total" as const },
    ],
    [baseline.revenue, projection, addedHhas],
  );

  return (
    <MarketAnalysisSection
      title="Scenario Planning"
      subtitle="Waterfall revenue impact from operational levers"
      emphasis="tertiary"
    >
      <WaterfallChart steps={waterfallSteps} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Increase PG conversion by {pgConversionBoost}%</span>
            <input
              type="range"
              min={0}
              max={20}
              value={pgConversionBoost}
              onChange={(e) => setPgConversionBoost(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Add {addedHhas} HHAs</span>
            <input
              type="range"
              min={0}
              max={10}
              value={addedHhas}
              onChange={(e) => setAddedHhas(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Reduce onboarding time by {onboardingReduction} days</span>
            <input
              type="range"
              min={0}
              max={21}
              value={onboardingReduction}
              onChange={(e) => setOnboardingReduction(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Projected revenue</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(projection.revenue)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Patient impact</p>
            <p className="text-xl font-semibold tabular-nums">{formatNumber(projection.patients)}</p>
            <p className="text-xs text-emerald-600">+{formatNumber(projection.patientDelta)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Patient reach</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatPercent(projection.patientReach)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Opportunity score</p>
            <p className="text-xl font-semibold tabular-nums">{projection.opportunityScore}</p>
          </div>
        </div>
      </div>
    </MarketAnalysisSection>
  );
}
