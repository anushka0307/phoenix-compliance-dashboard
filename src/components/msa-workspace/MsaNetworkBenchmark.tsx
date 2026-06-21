import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsaBenchmarkComparison } from "@/types/msaWorkspace";
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

interface MsaNetworkBenchmarkProps {
  benchmarks: MsaBenchmarkComparison[];
}

export function MsaNetworkBenchmark({ benchmarks }: MsaNetworkBenchmarkProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">MSA vs Network Average</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {benchmarks.map((item) => (
          <Card key={item.id} className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xl font-semibold tabular-nums">{item.value}</p>
              <p className="text-xs text-muted-foreground">Network Average: {item.networkAverage}</p>
              <p className={cn("text-[11px] font-medium", statusStyle[item.status])}>
                {statusLabel[item.status]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
