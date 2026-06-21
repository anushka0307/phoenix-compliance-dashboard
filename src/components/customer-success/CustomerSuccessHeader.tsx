import type { CsAccountHeader, CsTopKpis } from "@/types/customerSuccess";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency, formatNumber } from "@/utils/format";

interface CustomerSuccessHeaderProps {
  header: CsAccountHeader;
  topKpis: CsTopKpis;
}

const STATUS_VARIANT = {
  healthy: "success",
  watchlist: "warning",
  "at-risk": "destructive",
} as const;

const STATUS_LABEL = {
  healthy: "Healthy",
  watchlist: "Watchlist",
  "at-risk": "At Risk",
} as const;

const LIFECYCLE_LABEL = {
  onboarding: "Onboarding",
  stabilizing: "Stabilizing",
  healthy: "Healthy",
  expanding: "Expanding",
  strategic: "Strategic",
} as const;

export function CustomerSuccessHeader({ header, topKpis }: CustomerSuccessHeaderProps) {
  const healthUp = topKpis.accountHealthScore >= topKpis.previousHealthScore;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{header.pgName}</h2>
            <Badge variant={STATUS_VARIANT[header.accountStatus]}>
              {STATUS_LABEL[header.accountStatus]}
            </Badge>
            <Badge variant="outline">{LIFECYCLE_LABEL[header.lifecycleStage]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {header.msaName} · CSM: {header.csmName} · Owner: {header.accountOwner}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Renewal: <span className="font-medium text-foreground">{header.renewalDate}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Account Health Score"
          value={String(topKpis.accountHealthScore)}
          subtext={`${healthUp ? "+" : ""}${topKpis.accountHealthScore - topKpis.previousHealthScore} vs prior`}
          trend={healthUp ? "up" : "down"}
        />
        <KpiCard label="ARR" value={formatCurrency(topKpis.arr)} />
        <KpiCard label="Monthly Revenue" value={formatCurrency(topKpis.monthlyRevenue)} />
        <KpiCard label="Value Score" value={String(topKpis.valueScore)} />
        <KpiCard label="Rapport Score" value={String(topKpis.rapportScore)} />
        <KpiCard label="NPS" value={formatNumber(topKpis.nps)} subtext="Satisfaction" />
      </div>
    </div>
  );
}
