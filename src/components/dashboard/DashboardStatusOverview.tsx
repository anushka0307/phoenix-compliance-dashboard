import { useNetwork } from "@/contexts/NetworkContext";
import { getNetworkStatusSummary } from "@/utils/networkAnalytics";
import { Badge } from "@/components/ui/badge";

const statusBadge = {
  Healthy: "success",
  Opportunity: "warning",
  "Needs Attention": "destructive",
} as const;

export function DashboardStatusOverview() {
  const { dashboardMsas } = useNetwork();
  const summary = getNetworkStatusSummary(dashboardMsas);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">Network Status</span>
        <Badge variant={statusBadge[summary.overallStatus]}>{summary.overallStatus}</Badge>
      </div>
      <p className="text-muted-foreground">
        {summary.growing} Growing · {summary.intervention} Require Intervention ·{" "}
        {summary.opportunity} Expansion · {summary.inactive} Inactive
      </p>
    </div>
  );
}
