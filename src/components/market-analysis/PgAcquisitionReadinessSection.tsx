import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { PgAcquisitionTarget } from "@/types/marketAnalysis";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface PgAcquisitionReadinessSectionProps {
  targets: PgAcquisitionTarget[];
}

const difficultyStyles = {
  Low: "border-emerald-200 bg-emerald-50/50",
  Medium: "border-amber-200 bg-amber-50/50",
  High: "border-red-200 bg-red-50/50",
} as const;

export function PgAcquisitionReadinessSection({ targets }: PgAcquisitionReadinessSectionProps) {
  return (
    <MarketAnalysisSection
      title="PG Acquisition Readiness"
      subtitle="Ranked targets with modeled revenue — referrals × conversion × revenue per patient"
      emphasis="primary"
      compact
    >
      <ol className="space-y-2">
        {targets.map((target, index) => (
          <li
            key={`${target.county}-${target.targetSpecialty}`}
            className={cn(
              "flex items-center gap-4 rounded-lg border px-4 py-3",
              difficultyStyles[target.acquisitionDifficulty],
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-sm font-bold tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {target.county} · {target.targetSpecialty}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(target.estimatedAnnualReferrals)} referrals ×{" "}
                {formatPercent(target.expectedConversionRate)} ×{" "}
                {formatCurrency(target.revenuePerPatient)}/patient
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{formatPercent(target.priorityScore)}</p>
              <p className="text-xs font-medium text-foreground">
                {formatCurrency(target.estimatedRevenue)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </MarketAnalysisSection>
  );
}
