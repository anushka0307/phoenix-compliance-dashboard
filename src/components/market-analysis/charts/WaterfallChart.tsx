import { formatCurrency } from "@/utils/format";

export interface WaterfallStep {
  id: string;
  label: string;
  value: number;
  type: "baseline" | "delta" | "total";
}

interface WaterfallChartProps {
  steps: WaterfallStep[];
  width?: number;
  height?: number;
}

export function WaterfallChart({ steps, width = 720, height = 360 }: WaterfallChartProps) {
  const pad = { top: 28, right: 20, bottom: 56, left: 20 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const barW = innerW / steps.length - 10;

  let running = 0;
  const bars = steps.map((step) => {
    let y0: number;
    let y1: number;
    if (step.type === "baseline") {
      y0 = 0;
      y1 = step.value;
      running = step.value;
    } else if (step.type === "total") {
      y0 = 0;
      y1 = step.value;
    } else {
      y0 = running;
      y1 = running + step.value;
      running += step.value;
    }
    return { ...step, y0, y1 };
  });

  const maxY = Math.max(...bars.map((b) => Math.max(b.y0, b.y1)), 1);
  const scaleY = (v: number) => pad.top + innerH - (v / maxY) * innerH;
  const barHeight = (b: (typeof bars)[0]) => Math.abs(scaleY(b.y0) - scaleY(b.y1));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="min-h-[360px] w-full">
      {bars.map((bar, index) => {
        const x = pad.left + index * (barW + 10);
        const top = scaleY(Math.max(bar.y0, bar.y1));
        const h = barHeight(bar) || 2;
        const fill =
          bar.type === "baseline"
            ? "#94a3b8"
            : bar.type === "total"
              ? "#3b82f6"
              : bar.value >= 0
                ? "#10b981"
                : "#ef4444";
        const display =
          bar.type === "delta"
            ? `${bar.value >= 0 ? "+" : ""}${formatCurrency(bar.value)}`
            : formatCurrency(bar.y1);
        return (
          <g key={bar.id}>
            <rect x={x} y={top} width={barW} height={h} rx={4} fill={fill}>
              <title>
                {bar.label}: {display}
              </title>
            </rect>
            <text x={x + barW / 2} y={top - 6} textAnchor="middle" fill="#0f172a" fontSize={10} fontWeight={600}>
              {display}
            </text>
            <text x={x + barW / 2} y={height - 16} textAnchor="middle" fill="#64748b" fontSize={9}>
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
