import { useEffect, useMemo, useState } from "react";
import type { PhysicianGraphLink, PhysicianGraphNode } from "@/types/marketAnalysis";
import { resolveLabelCollisions, separateOverlappingNodes } from "@/utils/graphLabelLayout";

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

const PADDING = 52;
const LINK_DISTANCE = 118;
const LINK_FORCE = 0.034;
const REPULSION_GAP = 30;

function nodeRadius(type: PhysicianGraphNode["type"]): number {
  if (type === "physician") return 6;
  if (type === "competitor-pg") return 9;
  return 11;
}

function runSimulation(
  nodes: PhysicianGraphNode[],
  links: PhysicianGraphLink[],
  width: number,
  height: number,
): SimNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const spread = Math.min(width, height) * 0.28;

  const positions: SimNode[] = nodes.map((node, index) => ({
    ...node,
    x: centerX + Math.cos((index / Math.max(nodes.length, 1)) * Math.PI * 2) * spread,
    y: centerY + Math.sin((index / Math.max(nodes.length, 1)) * Math.PI * 2) * spread * 0.85,
  }));

  for (let tick = 0; tick < 160; tick += 1) {
    positions.forEach((node) => {
      node.x += (centerX - node.x) * 0.0018;
      node.y += (centerY - node.y) * 0.0018;
    });

    links.forEach((link) => {
      const a = positions.find((n) => n.id === link.source);
      const b = positions.find((n) => n.id === link.target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - LINK_DISTANCE) * LINK_FORCE;
      a.x += (dx / dist) * force;
      a.y += (dy / dist) * force;
      b.x -= (dx / dist) * force;
      b.y -= (dy / dist) * force;
    });

    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const a = positions[i];
        const b = positions[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = nodeRadius(a.type) + nodeRadius(b.type) + REPULSION_GAP;
        if (dist >= minDist) continue;

        const push = ((minDist - dist) / dist) * 0.48;
        const ox = dx * push;
        const oy = dy * push;
        a.x -= ox;
        a.y -= oy;
        b.x += ox;
        b.y += oy;
      }
    }

    positions.forEach((node) => {
      node.x = Math.max(PADDING, Math.min(width - PADDING, node.x));
      node.y = Math.max(PADDING, Math.min(height - PADDING, node.y));
    });
  }

  const separated = separateOverlappingNodes(
    positions.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      radius: nodeRadius(node.type),
    })),
    {
      minX: PADDING,
      minY: PADDING,
      maxX: width - PADDING,
      maxY: height - PADDING,
    },
    18,
  );

  return positions.map((node) => {
    const next = separated.get(node.id);
    return next ? { ...node, x: next.x, y: next.y } : node;
  });
}

export function ForceDirectedGraph({
  nodes,
  links,
  width = 720,
  height = 460,
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

  const labelPlacements = useMemo(() => {
    const visibleLabels = layout
      .filter((node) => hovered === node.id || node.type !== "physician")
      .map((node) => {
        const radius = nodeRadius(node.type);
        const display =
          node.label.length > 20 ? `${node.label.slice(0, 19)}…` : node.label;
        return {
          id: node.id,
          anchorX: node.x,
          anchorY: node.y + radius + 12,
          text: display,
        };
      });

    return resolveLabelCollisions(visibleLabels, { fontSize: 9, labelHeight: 12 });
  }, [layout, hovered]);

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
        className="min-h-[460px] w-full rounded-lg border border-border bg-slate-50"
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
        {layout.map((node) => {
          const radius = nodeRadius(node.type);
          const showLabel = hovered === node.id || node.type !== "physician";
          const label = labelPlacements.get(node.id);

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={NODE_COLORS[node.type]}
                stroke="#fff"
                strokeWidth={2}
                opacity={hovered && hovered !== node.id ? 0.45 : 1}
              />
              {showLabel && label && (
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor={label.textAnchor ?? "middle"}
                  dominantBaseline={label.dominantBaseline ?? "hanging"}
                  fill="#334155"
                  fontSize={9}
                >
                  {node.label.length > 20 ? `${node.label.slice(0, 19)}…` : node.label}
                </text>
              )}
              <title>{node.label}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
