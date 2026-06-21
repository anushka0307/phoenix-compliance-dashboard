import { Info, Lightbulb, LineChart, Users } from "lucide-react";
import type { CountyCoverageRow } from "@/types/marketAnalysis";
import { formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface CountyCoverageStackedBarProps {
  counties: CountyCoverageRow[];
}

interface CountyBarRow {
  county: CountyCoverageRow;
  rank: number;
  coveredPct: number;
  uncoveredPct: number;
  opportunityPct: number;
}

const COLORS = {
  covered: "#10b981",
  uncovered: "#e2e8f0",
  opportunity: "#3b82f6",
} as const;

const LEGEND = [
  { key: "covered", label: "Covered (Referral Coverage)", color: COLORS.covered },
  { key: "uncovered", label: "Uncovered (Gap)", color: COLORS.uncovered },
  { key: "opportunity", label: "Opportunity (High-Value Gap)", color: COLORS.opportunity },
] as const;

function buildCountyRows(counties: CountyCoverageRow[]): CountyBarRow[] {
  const sorted = [...counties].sort((a, b) => b.opportunityScore - a.opportunityScore);

  return sorted.map((county, index) => {
    const coveredPct = county.referralCoverage;
    const uncoveredPct = clampPercent(100 - coveredPct);
    const opportunityPct = clampPercent(uncoveredPct * (county.opportunityScore / 100));

    return {
      county,
      rank: index + 1,
      coveredPct,
      uncoveredPct,
      opportunityPct,
    };
  });
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function BarLabel({ value, className }: { value: number; className?: string }) {
  if (value < 10) return null;
  return (
    <span className={cn("text-[10px] font-medium tabular-nums", className)}>
      {Math.round(value)}%
    </span>
  );
}

export function CountyCoverageStackedBar({ counties }: CountyCoverageStackedBarProps) {
  const rows = buildCountyRows(counties);

  return (
    <div className="space-y-4" data-coverage-drilldown-root>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {LEGEND.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
        <div className="flex max-w-xs items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>Opportunity represents the highest-value portion of the uncovered market.</span>
        </div>
      </div>

      <p className="text-center text-[11px] font-medium text-muted-foreground">
        % of Addressable Patients
      </p>

      <div className="space-y-4 rounded-lg border border-border p-3 sm:p-4">
        {rows.map((row) => {
          const opportunityShareOfGap =
            row.uncoveredPct > 0 ? row.opportunityPct / row.uncoveredPct : 0;

          return (
            <div
              key={row.county.county}
              className="grid cursor-pointer gap-3 rounded-md p-1 transition-colors hover:bg-muted/20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1fr)] lg:items-center"
              title={`${row.county.county}: ${formatNumber(row.county.addressablePatients)} addressable patients`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-4 shrink-0 text-xs font-medium text-muted-foreground">
                  {row.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.county.county}
                  </p>
                  <div className="mt-1 inline-flex min-w-[72px] flex-col items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
                    <span className="text-sm font-semibold tabular-nums text-emerald-700">
                      {row.county.opportunityScore}
                    </span>
                    <span className="text-[9px] text-emerald-700/80">Opportunity Score</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div
                  className="flex h-8 w-full overflow-hidden rounded-md"
                  role="img"
                  aria-label={`${row.county.county} referral coverage breakdown`}
                >
                  {row.coveredPct > 0 && (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{
                        width: `${row.coveredPct}%`,
                        backgroundColor: COLORS.covered,
                      }}
                      title={`Covered: ${formatPercent(row.coveredPct)}`}
                    >
                      <BarLabel value={row.coveredPct} className="text-white" />
                    </div>
                  )}
                  {row.uncoveredPct > 0 && (
                    <div
                      className="relative h-full"
                      style={{
                        width: `${row.uncoveredPct}%`,
                        backgroundColor: COLORS.uncovered,
                      }}
                      title={`Uncovered: ${formatPercent(row.uncoveredPct)}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BarLabel value={row.uncoveredPct} className="text-slate-600" />
                      </div>
                      {row.opportunityPct > 0 && (
                        <div
                          className="absolute right-0 top-0 flex h-full items-center justify-center"
                          style={{
                            width: `${opportunityShareOfGap * 100}%`,
                            backgroundColor: COLORS.opportunity,
                          }}
                          title={`Opportunity: ${formatPercent(row.opportunityPct)} of addressable patients`}
                        >
                          <BarLabel value={row.opportunityPct} className="text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-muted-foreground lg:text-right">
                <p className="flex items-center gap-1.5 lg:justify-end">
                  <Users className="size-3.5 shrink-0" />
                  <span className="tabular-nums">
                    {formatNumber(row.county.addressablePatients)} addressable
                  </span>
                </p>
                <p className="flex items-center gap-1.5 lg:justify-end">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS.covered }}
                  />
                  <span className="tabular-nums">
                    {formatPercent(row.coveredPct)} referral coverage
                  </span>
                </p>
                <p className="flex items-center gap-1.5 lg:justify-end">
                  <LineChart className="size-3.5 shrink-0" />
                  <span className="tabular-nums">
                    Opportunity score: {row.county.opportunityScore}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
        <span className="inline-flex items-center gap-1.5">
          <Lightbulb className="size-3.5 shrink-0 text-blue-600" />
          <strong className="font-medium text-foreground">Covered:</strong>
          Patients reached through partnered referral pathways
        </span>
        <span>
          <strong className="font-medium text-foreground">Uncovered:</strong> Remaining addressable
          patients
        </span>
        <span>
          <strong className="font-medium text-foreground">Opportunity:</strong> Highest-value portion
          of the uncovered gap
        </span>
      </div>
    </div>
  );
}
