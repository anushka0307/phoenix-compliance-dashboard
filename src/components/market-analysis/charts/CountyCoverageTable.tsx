import type { CountyCoverageRow } from "@/types/marketAnalysis";
import { formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface CountyCoverageTableProps {
  counties: CountyCoverageRow[];
}

function opportunityTone(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-blue-500";
  return "bg-amber-500";
}

function InlineBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-1.5 w-full min-w-[72px] overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full bg-primary/80", className)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function deriveReferralCoverage(row: CountyCoverageRow): number {
  const reachFactor = row.patientReach;
  const pgFactor = row.pgPenetration;
  const zipPenalty = Math.min(30, row.uncoveredZips * 4);
  return Math.max(0, Math.min(100, Math.round(reachFactor * 0.55 + pgFactor * 0.35 - zipPenalty)));
}

function deriveOpportunityScore(row: CountyCoverageRow, maxValue: number): number {
  return Math.round((row.opportunityValue / maxValue) * 100);
}

export function CountyCoverageTable({ counties }: CountyCoverageTableProps) {
  const sorted = [...counties].sort((a, b) => b.opportunityValue - a.opportunityValue);
  const maxOpportunity = Math.max(...sorted.map((row) => row.opportunityValue), 1);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">County</th>
            <th className="px-4 py-2.5 font-medium">Addressable Patients</th>
            <th className="px-4 py-2.5 font-medium">PG Penetration %</th>
            <th className="px-4 py-2.5 font-medium">Patient Reach %</th>
            <th className="px-4 py-2.5 font-medium">Referral Coverage %</th>
            <th className="px-4 py-2.5 font-medium">Opportunity Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const referralCoverage = deriveReferralCoverage(row);
            const opportunityScore = deriveOpportunityScore(row, maxOpportunity);
            return (
              <tr key={row.county} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{row.county}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatNumber(row.addressablePatients)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <InlineBar value={row.pgPenetration} />
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatPercent(row.pgPenetration)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <InlineBar value={row.patientReach} />
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatPercent(row.patientReach)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <InlineBar value={referralCoverage} className="bg-blue-500/80" />
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatPercent(referralCoverage)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", opportunityTone(opportunityScore))}
                      title={`Opportunity score ${opportunityScore}`}
                    />
                    <InlineBar value={opportunityScore} className={opportunityTone(opportunityScore)} />
                    <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
                      {opportunityScore}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
