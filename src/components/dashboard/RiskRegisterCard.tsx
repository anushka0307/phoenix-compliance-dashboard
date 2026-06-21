import { useNetwork } from "@/contexts/NetworkContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOperationalRisks } from "@/utils/networkAnalytics";
import { cn } from "@/utils/cn";

const severityDot = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
} as const;

export function RiskRegisterCard() {
  const { dashboardMsas } = useNetwork();
  const risks = getOperationalRisks(dashboardMsas);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Operational Risks</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {risks.map((risk) => (
            <li key={risk.id} className="flex items-start gap-2 text-sm">
              <span
                className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", severityDot[risk.severity])}
              />
              <span className="text-muted-foreground">{risk.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
