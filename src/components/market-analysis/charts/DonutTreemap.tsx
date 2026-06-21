import { useState } from "react";
import { CHART_COLORS } from "@/components/market-analysis/charts/chartColors";
import { formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
}

export function DonutChart({ segments, size = 200 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = size / 2 - 8;
  const innerRadius = radius * 0.58;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;

  const arcs = segments.map((segment, index) => {
    const slice = (segment.value / total) * Math.PI * 2;
    const start = angle;
    angle += slice;
    const end = angle;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const ix1 = cx + innerRadius * Math.cos(end);
    const iy1 = cy + innerRadius * Math.sin(end);
    const ix2 = cx + innerRadius * Math.cos(start);
    const iy2 = cy + innerRadius * Math.sin(start);
    const large = slice > Math.PI ? 1 : 0;
    const color = segment.color ?? CHART_COLORS[index % CHART_COLORS.length];
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${ix2} ${iy2} Z`;
    return { ...segment, path, color, percent: (segment.value / total) * 100 };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <path key={arc.id} d={arc.path} fill={arc.color} stroke="hsl(var(--background))" strokeWidth={1.5}>
            <title>
              {arc.label}: {formatPercent(arc.percent)}
            </title>
          </path>
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-semibold">
          {segments.length}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          competitors
        </text>
      </svg>
      <ul className="flex-1 space-y-1.5 text-xs">
        {arcs.map((arc) => (
          <li key={arc.id} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: arc.color }} />
              {arc.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{formatPercent(arc.percent)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface TreemapNode {
  id: string;
  label: string;
  value: number;
  color?: string;
}

interface TreemapChartProps {
  nodes: TreemapNode[];
  height?: number;
}

export function TreemapChart({ nodes, height = 200 }: TreemapChartProps) {
  const total = nodes.reduce((sum, n) => sum + n.value, 0) || 1;

  return (
    <div className="flex overflow-hidden rounded-lg border border-border" style={{ height }}>
      {nodes.map((node, index) => {
        const widthPct = (node.value / total) * 100;
        return (
          <div
            key={node.id}
            className="relative flex flex-col justify-end border-r border-background/30 p-2 last:border-r-0"
            style={{
              width: `${widthPct}%`,
              backgroundColor: node.color ?? CHART_COLORS[index % CHART_COLORS.length],
              opacity: 0.85,
            }}
            title={`${node.label}: ${node.value}`}
          >
            <span className="truncate text-[10px] font-medium text-white drop-shadow">{node.label}</span>
            <span className="text-[9px] text-white/80">{Math.round((node.value / total) * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}

interface DonutTreemapToggleProps {
  segments: DonutSegment[];
  treemapNodes: TreemapNode[];
}

export function DonutTreemapToggle({ segments, treemapNodes }: DonutTreemapToggleProps) {
  const [view, setView] = useState<"donut" | "treemap">("donut");

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-lg border border-border bg-muted/30 p-1 text-xs">
        {(["donut", "treemap"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setView(mode)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 font-medium capitalize transition-colors",
              view === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {mode}
          </button>
        ))}
      </div>
      {view === "donut" ? <DonutChart segments={segments} /> : <TreemapChart nodes={treemapNodes} />}
    </div>
  );
}
