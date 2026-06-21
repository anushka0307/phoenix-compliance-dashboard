import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TrendDirection } from "@/types/marketAnalysis";
import { cn } from "@/utils/cn";

interface MetricTrendCardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: TrendDirection;
  compact?: boolean;
}

export function MetricTrendCard({
  label,
  value,
  trend,
  trendDirection = "neutral",
  compact,
}: MetricTrendCardProps) {
  const TrendIcon = trendDirection === "down" ? TrendingDown : TrendingUp;

  return (
    <Card className="shadow-none">
      <CardContent className={compact ? "p-4" : "p-5"}>
        <p className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {label}
        </p>
        <p
          className={cn(
            "mt-1 font-semibold tracking-tight tabular-nums",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              "mt-1 inline-flex items-center gap-0.5 text-xs font-medium",
              trendDirection === "up" && "text-emerald-600",
              trendDirection === "down" && "text-red-600",
              trendDirection === "neutral" && "text-muted-foreground",
            )}
          >
            {trendDirection !== "neutral" && <TrendIcon className="size-3" />}
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
