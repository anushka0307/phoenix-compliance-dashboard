import { Card, CardContent } from "@/components/ui/card";
import type { MsaCoverageSummary } from "@/types/msaWorkspace";
import { formatNumber, formatPercent } from "@/utils/format";

interface MsaCoverageSummaryBarProps {
  summary: MsaCoverageSummary;
}

export function MsaCoverageSummaryBar({ summary }: MsaCoverageSummaryBarProps) {
  const items = [
    { label: "Coverage Counties", value: String(summary.coverageCounties) },
    { label: "Active Clients", value: String(summary.activeClients) },
    { label: "Population", value: formatNumber(summary.population) },
    { label: "Market Penetration", value: formatPercent(summary.marketPenetration) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
