import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNetworkStatusSummary } from "@/utils/networkAnalytics";
import type { NetworkOverallStatus } from "@/utils/networkAnalytics";

const statusConfig: Record<
  NetworkOverallStatus,
  { badge: "success" | "warning" | "destructive"; icon: typeof CheckCircle2; label: string }
> = {
  Healthy: { badge: "success", icon: CheckCircle2, label: "Healthy" },
  Opportunity: { badge: "warning", icon: TrendingUp, label: "Opportunity" },
  "Needs Attention": { badge: "destructive", icon: AlertTriangle, label: "Needs Attention" },
};

export function NetworkStatusCard() {
  const { msas } = useNetwork();
  const summary = getNetworkStatusSummary(msas);
  const config = statusConfig[summary.overallStatus];
  const StatusIcon = config.icon;

  return (
    <Card className="w-full max-w-[400px] shrink-0 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Badge variant={config.badge} className="gap-1">
            <StatusIcon className="size-3" />
            {config.label}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Network Health Overview</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• {summary.growing} Growing {summary.growing === 1 ? "Market" : "Markets"}</li>
            <li>• {summary.intervention} Require Intervention</li>
            {summary.opportunity > 0 && (
              <li>
                • {summary.opportunity} Expansion{" "}
                {summary.opportunity === 1 ? "Opportunity" : "Opportunities"}
              </li>
            )}
            {summary.inactive > 0 && (
              <li>
                • {summary.inactive} Inactive {summary.inactive === 1 ? "Market" : "Markets"}
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
