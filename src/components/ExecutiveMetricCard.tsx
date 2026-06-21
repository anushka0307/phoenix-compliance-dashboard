import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/utils/cn";

interface ExecutiveMetricCardProps {
  value: string;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  context?: string;
  className?: string;
}

export function ExecutiveMetricCard({
  value,
  label,
  trend,
  trendDirection = "neutral",
  context,
  className,
}: ExecutiveMetricCardProps) {
  const TrendIcon = trendDirection === "down" ? TrendingDown : TrendingUp;

  return (
    <div className={cn("space-y-1 py-4", className)}>
      <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {(trend || context) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trendDirection === "up" && "text-emerald-600",
                trendDirection === "down" && "text-red-600",
                trendDirection === "neutral" && "text-muted-foreground",
              )}
            >
              {trendDirection !== "neutral" && <TrendIcon className="size-3" />}
              {trend}
            </span>
          )}
          {context && <span className="text-xs text-muted-foreground">{context}</span>}
        </div>
      )}
    </div>
  );
}
