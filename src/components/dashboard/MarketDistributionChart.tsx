import { useNetwork } from "@/contexts/NetworkContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketDistribution } from "@/utils/networkAnalytics";

const SEGMENTS = [
  { key: "growing" as const, label: "Growing", color: "#22c55e" },
  { key: "opportunity" as const, label: "Opportunity", color: "#f59e0b" },
  { key: "attentionRequired" as const, label: "Attention Required", color: "#ef4444" },
  { key: "inactive" as const, label: "Inactive", color: "#94a3b8" },
];

export function MarketDistributionChart() {
  const { dashboardMsas } = useNetwork();
  const distribution = getMarketDistribution(dashboardMsas);
  const total = Object.values(distribution).reduce((s, v) => s + v, 0) || 1;

  let cumulative = 0;
  const gradientStops = SEGMENTS.map((seg) => {
    const value = distribution[seg.key];
    const start = cumulative;
    cumulative += (value / total) * 100;
    return `${seg.color} ${start}% ${cumulative}%`;
  }).join(", ");

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Market Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div
            className="size-36 shrink-0 rounded-full"
            style={{ background: total > 0 ? `conic-gradient(${gradientStops})` : "#e2e8f0" }}
            role="img"
            aria-label={`Market distribution: ${SEGMENTS.map((seg) => `${seg.label} ${distribution[seg.key]}`).join(", ")}`}
          />
          <ul className="min-w-0 flex-1 space-y-2 text-xs">
            {SEGMENTS.map((seg) => (
              <li key={seg.key} className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-muted-foreground">{seg.label}</span>
                <span className="ml-auto font-medium tabular-nums">{distribution[seg.key]}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
