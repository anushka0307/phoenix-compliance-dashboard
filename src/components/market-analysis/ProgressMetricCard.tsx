import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { clampPercent } from "@/utils/marketCalculations";

interface ProgressMetricCardProps {
  label: string;
  active: number;
  total: number;
  formatValue?: (value: number) => string;
}

export function ProgressMetricCard({
  label,
  active,
  total,
  formatValue = String,
}: ProgressMetricCardProps) {
  const percent = total > 0 ? clampPercent((active / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatValue(active)} / {formatValue(total)}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-primary transition-all")}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{percent}% coverage</p>
      </CardContent>
    </Card>
  );
}
