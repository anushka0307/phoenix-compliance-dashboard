import { formatPercent } from "@/utils/format";

export interface BubblePoint {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color?: string;
}

interface BubbleChartProps {
  points: BubblePoint[];
  xLabel: string;
  yLabel: string;
  targetX?: number;
  targetY?: number;
  width?: number;
  height?: number;
}

interface PlottedPoint {
  point: BubblePoint;
  cx: number;
  cy: number;
  r: number;
  labelY: number;
  labelAbove: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function avoidLabelCollisions(plotted: PlottedPoint[]): PlottedPoint[] {
  const sorted = [...plotted].sort((a, b) => a.cy - b.cy);
  const minGap = 12;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const current = sorted[i];
    if (Math.abs(current.cx - prev.cx) < 48 && current.labelY - prev.labelY < minGap) {
      current.labelY = prev.labelY + minGap;
      current.labelAbove = true;
    }
  }

  return plotted;
}

export function BubbleChart({
  points,
  xLabel,
  yLabel,
  targetX,
  targetY,
  width = 560,
  height = 380,
}: BubbleChartProps) {
  const pad = { top: 48, right: 48, bottom: 80, left: 72 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxSize = Math.max(...points.map((p) => p.size), 1);
  const maxR = 22;

  const scaleR = (s: number) => 10 + (s / maxSize) * (maxR - 10);
  const scaleX = (v: number) => pad.left + (clamp(v, 0, 100) / 100) * innerW;
  const scaleY = (v: number) => pad.top + innerH - (clamp(v, 0, 100) / 100) * innerH;

  const plotted = avoidLabelCollisions(
    points.map((point) => {
      const r = scaleR(point.size);
      const cx = clamp(scaleX(point.x), pad.left + r + 2, pad.left + innerW - r - 2);
      const cy = clamp(scaleY(point.y), pad.top + r + 2, pad.top + innerH - r - 2);
      const belowY = cy + r + 14;
      const labelAbove = belowY > pad.top + innerH - 4;
      const labelY = labelAbove ? cy - r - 6 : belowY;
      return { point, cx, cy, r, labelY, labelAbove };
    }),
  );

  return (
    <figure>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="max-h-[400px]" role="img">
        <rect
          x={pad.left}
          y={pad.top}
          width={innerW}
          height={innerH}
          className="fill-muted/10"
          rx={4}
        />
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={pad.left + innerW}
          y2={pad.top + innerH}
          className="stroke-border"
          strokeWidth={1}
        />
        <line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={pad.top + innerH}
          className="stroke-border"
          strokeWidth={1}
        />
        {targetX !== undefined && (
          <line
            x1={scaleX(targetX)}
            y1={pad.top}
            x2={scaleX(targetX)}
            y2={pad.top + innerH}
            className="stroke-amber-500/60"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}
        {targetY !== undefined && (
          <line
            x1={pad.left}
            y1={scaleY(targetY)}
            x2={pad.left + innerW}
            y2={scaleY(targetY)}
            className="stroke-amber-500/60"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}
        {plotted.map(({ point, cx, cy, r, labelY, labelAbove }) => (
          <g key={point.id}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={point.color ?? "hsl(var(--primary) / 0.55)"}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
            <title>
              {point.label}: {formatPercent(point.x)} PG, {formatPercent(point.y)} reach
            </title>
            <text
              x={cx}
              y={labelY}
              textAnchor="middle"
              dominantBaseline={labelAbove ? "auto" : "hanging"}
              className="fill-muted-foreground text-[9px]"
            >
              {point.label.replace(" County", "")}
            </text>
          </g>
        ))}
        <text
          x={pad.left + innerW / 2}
          y={height - 20}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {xLabel}
        </text>
        <text
          x={20}
          y={pad.top + innerH / 2}
          textAnchor="middle"
          transform={`rotate(-90 20 ${pad.top + innerH / 2})`}
          className="fill-muted-foreground text-[10px]"
        >
          {yLabel}
        </text>
      </svg>
    </figure>
  );
}
