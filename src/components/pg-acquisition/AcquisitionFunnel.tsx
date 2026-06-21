import { useMemo, useState } from "react";
import type { PgAcquisitionStage } from "@/types/pgAcquisition";
import { formatCurrency, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

export interface FunnelStageMetric {
  id: PgAcquisitionStage;
  label: string;
  order: number;
  description: string;
  count: number;
  pipelineValue: number;
  avgDaysInStage: number;
}

interface AcquisitionFunnelProps {
  stages: FunnelStageMetric[];
  selectedStage: PgAcquisitionStage | null;
  onSelectStage: (stage: PgAcquisitionStage | null) => void;
}

interface FunnelSegment extends FunnelStageMetric {
  topWidth: number;
  bottomWidth: number;
  conversionFromPrevious: number | null;
}

function buildSegments(stages: FunnelStageMetric[]): FunnelSegment[] {
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  const topWidths = stages.map((stage, index) => {
    const countRatio = Math.max(0.14, stage.count / maxCount);
    const positionTaper = Math.max(0.42, 1 - index * 0.058);
    return Math.min(96, Math.max(30, countRatio * 94 * positionTaper));
  });

  return stages.map((stage, index) => {
    const topWidth = topWidths[index];
    const bottomWidth = topWidths[index + 1] ?? Math.max(24, topWidth * 0.72);

    const previous = stages[index - 1];
    const conversionFromPrevious =
      previous && previous.count > 0
        ? Math.round((stage.count / previous.count) * 100)
        : index === 0
          ? 100
          : null;

    return {
      ...stage,
      topWidth,
      bottomWidth,
      conversionFromPrevious,
    };
  });
}

export function AcquisitionFunnel({
  stages,
  selectedStage,
  onSelectStage,
}: AcquisitionFunnelProps) {
  const segments = useMemo(() => buildSegments(stages), [stages]);
  const [hoveredStage, setHoveredStage] = useState<PgAcquisitionStage | null>(null);

  const tooltipStage = hoveredStage
    ? segments.find((segment) => segment.id === hoveredStage)
    : null;

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {tooltipStage && (
        <div className="pointer-events-none absolute right-0 top-0 z-20 hidden w-52 rounded-lg border border-border bg-card p-3 text-xs shadow-md sm:block">
          <p className="font-semibold">{tooltipStage.label}</p>
          <dl className="mt-2 space-y-1 text-muted-foreground">
            <div className="flex justify-between gap-2">
              <dt>PG count</dt>
              <dd className="font-medium text-foreground">{tooltipStage.count}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Conversion</dt>
              <dd className="font-medium text-foreground">
                {tooltipStage.conversionFromPrevious !== null
                  ? formatPercent(tooltipStage.conversionFromPrevious)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Pipeline value</dt>
              <dd className="font-medium text-foreground">
                {formatCurrency(tooltipStage.pipelineValue)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Avg days in stage</dt>
              <dd className="font-medium text-foreground">{tooltipStage.avgDaysInStage} days</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex flex-col items-center">
        {segments.map((segment, index) => {
          const topLeft = 50 - segment.topWidth / 2;
          const topRight = 50 + segment.topWidth / 2;
          const bottomLeft = 50 - segment.bottomWidth / 2;
          const bottomRight = 50 + segment.bottomWidth / 2;
          const isSelected = selectedStage === segment.id;
          const isHovered = hoveredStage === segment.id;

          return (
            <button
              key={segment.id}
              type="button"
              onClick={() =>
                onSelectStage(selectedStage === segment.id ? null : segment.id)
              }
              onMouseEnter={() => setHoveredStage(segment.id)}
              onMouseLeave={() => setHoveredStage(null)}
              className={cn(
                "group relative w-full border-0 bg-transparent p-0 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "z-10 scale-[1.02]",
              )}
              style={{ height: index === segments.length - 1 ? 58 : 50, marginTop: index === 0 ? 0 : -1 }}
              title={`${segment.label}: ${segment.count} PGs · ${formatCurrency(segment.pipelineValue)}`}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 flex h-full flex-col items-center justify-center px-3 text-center transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isHovered
                      ? "bg-primary/85 text-primary-foreground"
                      : "bg-primary/70 text-primary-foreground hover:bg-primary/80",
                )}
                style={{
                  clipPath: `polygon(${topLeft}% 0%, ${topRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`,
                }}
              >
                <span className="text-xs font-semibold leading-tight sm:text-sm">
                  {segment.label}
                </span>
                <span className="mt-0.5 text-[10px] tabular-nums opacity-90 sm:text-xs">
                  {segment.count} PGs
                  {segment.conversionFromPrevious !== null && index > 0 && (
                    <> · {formatPercent(segment.conversionFromPrevious)}</>
                  )}
                </span>
                <span className="text-[10px] tabular-nums opacity-80 sm:text-xs">
                  {formatCurrency(segment.pipelineValue)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
