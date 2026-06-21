import { useState } from "react";
import { CHART_COLORS } from "@/components/market-analysis/charts/chartColors";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

export interface SankeyNode {
  id: string;
  label: string;
  column: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  conversionRate?: number;
  revenueImpact?: number;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  width?: number;
  height?: number;
}

export function SankeyDiagram({ nodes, links, width = 720, height = 450 }: SankeyDiagramProps) {
  const [zoom, setZoom] = useState(1);
  const columns = 3;
  const colWidth = (width - 100) / columns;
  const nodeHeight = 26;
  const gap = 12;

  const nodesByColumn = Array.from({ length: columns }, (_, col) =>
    nodes.filter((n) => n.column === col),
  );

  const positions = new Map<string, { x: number; y: number; label: string }>();
  nodesByColumn.forEach((colNodes, colIndex) => {
    const startY = (height - colNodes.length * (nodeHeight + gap)) / 2;
    colNodes.forEach((node, rowIndex) => {
      positions.set(node.id, {
        x: 50 + colIndex * colWidth,
        y: startY + rowIndex * (nodeHeight + gap),
        label: node.label,
      });
    });
  });

  const maxLink = Math.max(...links.map((l) => l.value), 1);
  const columnLabels = ["Physician Groups", "Partner HHAs", "Counties"];

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <label className="flex items-center gap-2">
          Zoom
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24"
          />
        </label>
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="min-h-[450px] w-full rounded-lg border border-border bg-background"
        role="img"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
      >
        {columnLabels.map((label, colIndex) => (
          <text
            key={label}
            x={50 + colIndex * colWidth + 40}
            y={24}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-medium"
          >
            {label}
          </text>
        ))}
        {links.map((link, index) => {
          const source = positions.get(link.source);
          const target = positions.get(link.target);
          if (!source || !target) return null;
          const strokeW = 3 + (link.value / maxLink) * 18;
          const sx = source.x + 88;
          const sy = source.y + nodeHeight / 2;
          const tx = target.x;
          const ty = target.y + nodeHeight / 2;
          const cx1 = sx + (tx - sx) * 0.45;
          const cx2 = sx + (tx - sx) * 0.55;
          const tooltip = `${source.label} → ${target.label}\nReferral volume: ${formatNumber(link.value)}${link.conversionRate !== undefined ? `\nConversion: ${formatPercent(link.conversionRate)}` : ""}${link.revenueImpact !== undefined ? `\nRevenue impact: ${formatCurrency(link.revenueImpact)}` : ""}`;
          return (
            <path
              key={`${link.source}-${link.target}-${index}`}
              d={`M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ty}, ${tx} ${ty}`}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={strokeW}
              opacity={0.5}
            >
              <title>{tooltip}</title>
            </path>
          );
        })}
        {nodes.map((node, index) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          return (
            <g key={node.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={88}
                height={nodeHeight}
                rx={4}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                opacity={0.92}
              >
                <title>{node.label}</title>
              </rect>
              <text
                x={pos.x + 6}
                y={pos.y + nodeHeight / 2 + 4}
                className="fill-white text-[9px] font-medium"
              >
                {node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
