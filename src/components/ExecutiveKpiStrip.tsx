import { useNetwork, useNetworkKpis } from "@/contexts/NetworkContext";
import { getNetworkKpiTrends } from "@/utils/networkAnalytics";
import { formatCurrency, formatNumber } from "@/utils/format";
import { cn } from "@/utils/cn";

interface KpiStripItemProps {
  value: string;
  label: string;
  trendLabel?: string;
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
}

function KpiStripItem({
  value,
  label,
  trendLabel,
  trendDirection = "neutral",
  className,
}: KpiStripItemProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-3 transition-all duration-500",
        className,
      )}
    >
      <p className="text-xl font-semibold tracking-tight text-foreground tabular-nums sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
      {trendLabel && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trendDirection === "up" && "text-emerald-600",
            trendDirection === "down" && "text-red-600",
            trendDirection === "neutral" && "text-muted-foreground",
          )}
        >
          {trendLabel}
        </p>
      )}
    </div>
  );
}

export function ExecutiveKpiStrip() {
  const { dashboardMsas, dashboardPreviousMsas, dateRange } = useNetwork();
  const kpis = useNetworkKpis();
  const trends = getNetworkKpiTrends(dashboardMsas, dateRange, dashboardPreviousMsas);

  return (
    <section aria-label="Network at a glance" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Network at a Glance</h2>
        <p className="text-xs text-muted-foreground">Key indicators for executive review</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
        <KpiStripItem
          value={formatCurrency(kpis.revenue)}
          label="Network Revenue"
          trendLabel={trends.revenue.label}
          trendDirection={trends.revenue.direction}
        />
        <KpiStripItem
          value={formatNumber(kpis.patients)}
          label="Patients Managed"
          trendLabel={trends.patients.label}
          trendDirection={trends.patients.direction}
        />
        <KpiStripItem
          value={String(kpis.physicianGroups)}
          label="Physician Groups"
          trendLabel={trends.physicianGroups.label}
          trendDirection={trends.physicianGroups.direction}
        />
        <KpiStripItem
          value={String(kpis.homeHealthAgencies)}
          label="Home Health Agencies"
          trendLabel={trends.homeHealthAgencies.label}
          trendDirection={trends.homeHealthAgencies.direction}
        />
        <KpiStripItem
          value={String(kpis.avgMarketStrength)}
          label="Average Market Strength"
          trendLabel={trends.marketStrength.label}
          trendDirection={trends.marketStrength.direction}
        />
        <KpiStripItem
          value={`${kpis.networkHealthScore} / 100`}
          label="Network Health Score"
          trendLabel={trends.networkHealth.label}
          trendDirection={trends.networkHealth.direction}
          className="col-span-2 md:col-span-1"
        />
      </div>
    </section>
  );
}
