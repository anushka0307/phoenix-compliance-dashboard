import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { BenchmarkMetric } from "@/types/marketAnalysis";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface BenchmarkComparisonSectionProps {
  benchmarks: BenchmarkMetric[];
}

const statusStyles = {
  above: "text-emerald-700 bg-emerald-50",
  near: "text-amber-700 bg-amber-50",
  below: "text-red-700 bg-red-50",
} as const;

function formatBenchmarkValue(metric: BenchmarkMetric, value: number): string {
  if (metric.format === "currency") return formatCurrency(value);
  if (metric.format === "percent") return formatPercent(value);
  if (metric.format === "days") return `${formatNumber(value)} days`;
  return formatNumber(value);
}

export function BenchmarkComparisonSection({ benchmarks }: BenchmarkComparisonSectionProps) {
  return (
    <MarketAnalysisSection
      title="Benchmark Comparison"
      subtitle="MSA performance vs network and top quartile"
      emphasis="secondary"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Metric</th>
              <th className="pb-2 pr-4 font-medium">MSA</th>
              <th className="pb-2 pr-4 font-medium">Network Avg</th>
              <th className="pb-2 pr-4 font-medium">Top Quartile</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-4 font-medium text-foreground">{row.label}</td>
                <td className="py-2.5 pr-4 tabular-nums">{formatBenchmarkValue(row, row.msaValue)}</td>
                <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">
                  {formatBenchmarkValue(row, row.networkAvg)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">
                  {formatBenchmarkValue(row, row.topQuartile)}
                </td>
                <td className="py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      statusStyles[row.status],
                    )}
                  >
                    {row.status === "above"
                      ? "Above"
                      : row.status === "below"
                        ? "Below"
                        : "Near"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MarketAnalysisSection>
  );
}
