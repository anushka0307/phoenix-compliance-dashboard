import { useMemo } from "react";
import type { CampaignFunnelMetrics } from "@/types/acquisitionCampaign";
import { formatCurrency, formatPercent } from "@/utils/format";

interface CampaignExecutionFunnelProps {
  stages: CampaignFunnelMetrics[];
}

export function CampaignExecutionFunnel({ stages }: CampaignExecutionFunnelProps) {
  const segments = useMemo(() => {
    const maxCount = Math.max(...stages.map((s) => s.count), 1);
    const topWidths = stages.map((stage, index) => {
      const countRatio = Math.max(0.14, stage.count / maxCount);
      const positionTaper = Math.max(0.42, 1 - index * 0.058);
      return Math.min(96, Math.max(30, countRatio * 94 * positionTaper));
    });
    return stages.map((stage, index) => ({
      ...stage,
      topWidth: topWidths[index],
      bottomWidth: topWidths[index + 1] ?? Math.max(24, topWidths[index] * 0.72),
    }));
  }, [stages]);

  return (
    <div className="mx-auto w-full max-w-md">
      {segments.map((segment, index) => {
        const topLeft = 50 - segment.topWidth / 2;
        const topRight = 50 + segment.topWidth / 2;
        const bottomLeft = 50 - segment.bottomWidth / 2;
        const bottomRight = 50 + segment.bottomWidth / 2;
        return (
          <div
            key={segment.stage}
            className="relative w-full"
            style={{ height: index === segments.length - 1 ? 52 : 46, marginTop: index === 0 ? 0 : -1 }}
            title={`${segment.label}: ${segment.count} · ${formatCurrency(segment.pipelineValue)}`}
          >
            <div
              className="absolute inset-x-0 top-0 flex h-full flex-col items-center justify-center bg-primary/75 px-2 text-center text-primary-foreground"
              style={{
                clipPath: `polygon(${topLeft}% 0%, ${topRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`,
              }}
            >
              <span className="text-xs font-semibold">{segment.label}</span>
              <span className="text-[10px] tabular-nums opacity-90">
                {segment.count}
                {segment.conversionFromPrevious !== null && index > 0 && (
                  <> · {formatPercent(segment.conversionFromPrevious)}</>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
