import { Link } from "react-router-dom";
import { useNetwork } from "@/contexts/NetworkContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExpansionOpportunities } from "@/utils/networkAnalytics";
import { formatCurrency } from "@/utils/format";

const priorityVariant = {
  High: "destructive",
  Medium: "warning",
  Low: "secondary",
} as const;

export function ExpansionOpportunitiesTable() {
  const { dashboardMsas, dashboardAllMsas } = useNetwork();
  const opportunities = getExpansionOpportunities(
    dashboardMsas.length > 0 ? dashboardMsas : dashboardAllMsas,
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Highest Growth Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">MSA</th>
                <th className="px-4 py-2 font-medium">Est. Revenue Potential</th>
                <th className="px-4 py-2 font-medium">Market Strength</th>
                <th className="px-4 py-2 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((row) => (
                <tr key={row.msaId} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <Link to={`/msa/${row.msaId}`} className="font-medium hover:text-primary">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {formatCurrency(row.estimatedRevenuePotential)}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{row.marketStrength}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={priorityVariant[row.priority]}>{row.priority}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
