import { HelpCircle } from "lucide-react";
import type { MetricDefinition } from "@/data/metricDefinitions";
import { cn } from "@/utils/cn";

interface MetricTooltipProps {
  metric: MetricDefinition;
  className?: string;
}

export function MetricTooltip({ metric, className }: MetricTooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <HelpCircle className="size-3.5 text-muted-foreground/70" aria-hidden />
      <span className="sr-only">{metric.label}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs text-popover-foreground shadow-md group-hover:block group-focus-within:block"
      >
        <span className="font-semibold text-foreground">{metric.label}</span>
        <p className="mt-1 text-muted-foreground">{metric.definition}</p>
        {metric.formula && (
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-foreground/80">
            {metric.formula}
          </p>
        )}
        <p className="mt-1.5 text-muted-foreground">{metric.relevance}</p>
      </span>
    </span>
  );
}
