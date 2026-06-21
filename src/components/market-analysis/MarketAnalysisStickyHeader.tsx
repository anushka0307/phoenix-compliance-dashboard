import type { MSA } from "@/types/msa";
import { MsaStatusBadge } from "@/components/MsaStatusBadge";
import { formatPercent } from "@/utils/format";

interface MarketAnalysisStickyHeaderProps {
  msa: MSA;
  opportunityScore: number;
  pgPenetration: number;
  patientReach: number;
}

export function MarketAnalysisStickyHeader({
  msa,
  opportunityScore,
  pgPenetration,
  patientReach,
}: MarketAnalysisStickyHeaderProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:-mx-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Market Analysis
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {msa.name}
            </h1>
            <MsaStatusBadge status={msa.status} compact />
          </div>
        </div>
        <dl className="flex shrink-0 items-center gap-4 text-right">
          <div>
            <dt className="text-[11px] font-medium text-muted-foreground">Opportunity</dt>
            <dd className="text-lg font-semibold tabular-nums text-primary">{opportunityScore}</dd>
          </div>
          <div className="hidden sm:block">
            <dt className="text-[11px] font-medium text-muted-foreground">PG Penetration</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {formatPercent(pgPenetration)}
            </dd>
          </div>
          <div className="hidden md:block">
            <dt className="text-[11px] font-medium text-muted-foreground">Patient Reach</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {formatPercent(patientReach)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
