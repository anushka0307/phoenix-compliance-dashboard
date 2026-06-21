import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

export interface BarChartItem {
  label: string;
  value: number;
  displayValue?: string;
  sublabel?: string;
}

interface HorizontalBarChartProps {
  items: BarChartItem[];
  maxValue?: number;
  format?: "percent" | "currency" | "number";
  barClassName?: string;
  targetLine?: number;
  targetLabel?: string;
}

function formatValue(value: number, format: "percent" | "currency" | "number"): string {
  if (format === "percent") return formatPercent(value);
  if (format === "currency") return formatCurrency(value);
  return formatNumber(value);
}

export function HorizontalBarChart({
  items,
  maxValue,
  format = "percent",
  barClassName,
  targetLine,
  targetLabel,
}: HorizontalBarChartProps) {
  const max = maxValue ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="font-medium text-foreground">{item.label}</span>
              {item.sublabel && (
                <span className="ml-1.5 text-muted-foreground">{item.sublabel}</span>
              )}
            </div>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.displayValue ?? formatValue(item.value, format)}
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
            {targetLine !== undefined && (
              <div
                className="absolute top-0 z-10 h-full w-0.5 bg-amber-500"
                style={{ left: `${Math.min(100, (targetLine / max) * 100)}%` }}
                title={targetLabel}
              />
            )}
            <div
              className={cn("h-full rounded-full bg-primary/80", barClassName)}
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
