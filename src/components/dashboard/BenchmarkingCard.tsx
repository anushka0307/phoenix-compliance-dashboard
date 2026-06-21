import { useNetwork } from "@/contexts/NetworkContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBenchmarkMetrics } from "@/utils/networkAnalytics";
import { cn } from "@/utils/cn";

const statusLabel = {
  above: "Above benchmark",
  below: "Below benchmark",
  on_target: "On target",
} as const;

const statusStyle = {
  above: "text-emerald-600",
  below: "text-red-600",
  on_target: "text-muted-foreground",
} as const;

export function BenchmarkingCard() {
  const { msas } = useNetwork();
  const benchmarks = getBenchmarkMetrics(msas);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Industry Benchmarks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {benchmarks.map((metric) => (
          <div key={metric.id} className="flex items-baseline justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-foreground">{metric.label}</p>
              <p className="text-xs text-muted-foreground">Industry: {metric.industry}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">{metric.value}</p>
              <p className={cn("text-[11px]", statusStyle[metric.status])}>
                {statusLabel[metric.status]}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
