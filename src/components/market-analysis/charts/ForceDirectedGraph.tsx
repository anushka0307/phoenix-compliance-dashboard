import { useEffect, useMemo, useState } from "react";
import type { PhysicianGraphLink, PhysicianGraphNode } from "@/types/marketAnalysis";

interface SimNode extends PhysicianGraphNode {
  x: number;
  y: number;
}

interface ForceDirectedGraphProps {
  nodes: PhysicianGraphNode[];
  links: PhysicianGraphLink[];
  width?: number;
  height?: number;
  warmOnly?: boolean;
}

const NODE_COLORS: Record<PhysicianGraphNode["type"], string> = {
  "partner-pg": "#10b981",
  "target-pg": "#f59e0b",
  physician: "#3b82f6",
  "competitor-pg": "#94a3b8",
};

const LEGEND = [
  { type: "partner-pg" as const, label: "Partner PG" },
  { type: "target-pg" as const, label: "Acquisition target" },
  { type: "physician" as const, label: "Shared physician" },
  { type: "competitor-pg" as const, label: "Competitor PG" },
];

function runSimulation(
  nodes: PhysicianGraphNode[],
  links: PhysicianGraphLink[],
  width: number,
  height: number,
): SimNode[] {
  const positions: SimNode[] = nodes.map((node, index) => ({
    ...node,
    x: width / 2 + Math.cos((index / nodes.length) * Math.PI * 2) * 100,
    y: height / 2 + Math.sin((index / nodes.length) * Math.PI * 2) * 80,
  }));

  for (let tick = 0; tick < 100; tick += 1) {
    positions.forEach((node) => {
      node.x += (width / 2 - node.x) * 0.002;
      node.y += (height / 2 - node.y) * 0.002;
    });

    links.forEach((link) => {
      const a = positions.find((n) => n.id === link.source);
      const b = positions.find((n) => n.id === link.target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 80) * 0.04;
      a.x += (dx / dist) * force;
      a.y += (dy / dist) * force;
      b.x -= (dx / dist) * force;
      b.y -= (dy / dist) * force;
    });

    positions.forEach((node) => {
      node.x = Math.max(30, Math.min(width - 30, node.x));
      node.y = Math.max(30, Math.min(height - 30, node.y));
    });
  }

  return positions;
}

export function ForceDirectedGraph({
  nodes,
  links,
  width = 720,
  height = 420,
  warmOnly = false,
}: ForceDirectedGraphProps) {
  const filteredNodes = useMemo(() => {
    if (!warmOnly) return nodes;
    const warmIds = new Set(
      nodes.filter((n) => n.type === "target-pg" || n.type === "physician").map((n) => n.id),
    );
    nodes
      .filter((n) => n.type === "partner-pg")
      .forEach((p) => warmIds.add(p.id));
    return nodes.filter((n) => warmIds.has(n.id));
  }, [nodes, warmOnly]);

  const filteredLinks = useMemo(
    () =>
      links.filter(
        (l) =>
          filteredNodes.some((n) => n.id === l.source) &&
          filteredNodes.some((n) => n.id === l.target),
      ),
    [links, filteredNodes],
  );

  const nodeKey = filteredNodes.map((n) => n.id).join(",");
  const [layout, setLayout] = useState<SimNode[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    setLayout(runSimulation(filteredNodes, filteredLinks, width, height));
  }, [nodeKey, filteredNodes, filteredLinks, width, height]);

  const nodeRadius = (type: PhysicianGraphNode["type"]) => {
    if (type === "physician") return 6;
    if (type === "competitor-pg") return 9;
    return 11;
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {LEGEND.map((item) => (
          <span key={item.type} className="flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[item.type] }} />
            {item.label}
          </span>
        ))}
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="min-h-[420px] w-full rounded-lg border border-border bg-slate-50"
      >
        {filteredLinks.map((link, index) => {
          const a = layout.find((n) => n.id === link.source);
          const b = layout.find((n) => n.id === link.target);
          if (!a || !b) return null;
          const active = hovered === a.id || hovered === b.id;
          return (
            <line
              key={`${link.source}-${link.target}-${index}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={active ? "#64748b" : "#cbd5e1"}
              strokeWidth={active ? 2 : 1}
            />
          );
        })}
        {layout.map((node) => (
          <g
            key={node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius(node.type)}
              fill={NODE_COLORS[node.type]}
              stroke="#fff"
              strokeWidth={2}
              opacity={hovered && hovered !== node.id ? 0.45 : 1}
            />
            {(hovered === node.id || node.type !== "physician") && (
              <text
                x={node.x}
                y={node.y + nodeRadius(node.type) + 12}
                textAnchor="middle"
                fill="#334155"
                fontSize={9}
              >
                {node.label.length > 20 ? `${node.label.slice(0, 19)}…` : node.label}
              </text>
            )}
            <title>{node.label}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
