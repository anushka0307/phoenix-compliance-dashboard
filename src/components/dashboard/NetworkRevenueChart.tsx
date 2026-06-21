import { Link } from "react-router-dom";
import { useNetwork } from "@/contexts/NetworkContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueByMsa } from "@/utils/networkAnalytics";
import { formatCurrency } from "@/utils/format";

export function NetworkRevenueChart() {
  const { msas } = useNetwork();
  const data = getRevenueByMsa(msas);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Network Revenue by MSA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {data.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <Link to={`/msa/${item.id}`} className="truncate font-medium hover:text-primary">
                {item.name}
              </Link>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatCurrency(item.revenue)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/80"
                style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
