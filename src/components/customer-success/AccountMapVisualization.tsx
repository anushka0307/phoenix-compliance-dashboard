import { useMemo } from "react";
import type { CsPersonaLink, CsPersonaNode } from "@/types/customerSuccess";
import { resolveLabelCollisions, separateOverlappingNodes } from "@/utils/graphLabelLayout";
import { cn } from "@/utils/cn";

interface AccountMapVisualizationProps {
  nodes: CsPersonaNode[];
  links: CsPersonaLink[];
}

const STRENGTH_COLOR = {
  strong: "stroke-emerald-500",
  moderate: "stroke-amber-500",
  weak: "stroke-red-400",
};

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  pg: { x: 240, y: 170 },
  md: { x: 95, y: 75 },
  pm: { x: 310, y: 70 },
  ops: { x: 385, y: 110 },
  bm: { x: 55, y: 215 },
  cfo: { x: 410, y: 215 },
  it: { x: 240, y: 295 },
};

const CATEGORY_FALLBACK: Record<string, { x: number; y: number }> = {
  pg: { x: 240, y: 170 },
  clinical: { x: 95, y: 75 },
  operations: { x: 310, y: 70 },
  financial: { x: 55, y: 215 },
  executive: { x: 410, y: 215 },
  technical: { x: 240, y: 295 },
};

function nodeRadius(node: CsPersonaNode): number {
  return 12 + node.influenceScore / 12;
}

export function AccountMapVisualization({ nodes, links }: AccountMapVisualizationProps) {
  const positions = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const initial = nodes.map((node, index) => {
      const preset = NODE_POSITIONS[node.id];
      if (preset) return { id: node.id, x: preset.x, y: preset.y, radius: nodeRadius(node) };

      const count = categoryCounts.get(node.category) ?? 0;
      categoryCounts.set(node.category, count + 1);
      const base = CATEGORY_FALLBACK[node.category] ?? { x: 100 + index * 40, y: 100 };
      return {
        id: node.id,
        x: base.x + count * 36,
        y: base.y + count * 28,
        radius: nodeRadius(node),
      };
    });

    return separateOverlappingNodes(initial, {
      minX: 28,
      minY: 28,
      maxX: 452,
      maxY: 312,
    });
  }, [nodes]);

  const nameLabels = useMemo(
    () =>
      resolveLabelCollisions(
        nodes.map((node) => {
          const pos = positions.get(node.id);
          const radius = nodeRadius(node);
          return {
            id: `${node.id}-name`,
            anchorX: pos?.x ?? 0,
            anchorY: (pos?.y ?? 0) + radius + 14,
            text: node.name.split(" ")[0],
          };
        }),
        { fontSize: 9, labelHeight: 11 },
      ),
    [nodes, positions],
  );

  const roleLabels = useMemo(
    () =>
      resolveLabelCollisions(
        nodes.map((node) => {
          const pos = positions.get(node.id);
          const radius = nodeRadius(node);
          const namePlacement = nameLabels.get(`${node.id}-name`);
          return {
            id: `${node.id}-role`,
            anchorX: pos?.x ?? 0,
            anchorY: (namePlacement?.y ?? (pos?.y ?? 0) + radius + 14) + 10,
            text: node.role,
          };
        }),
        { fontSize: 8, labelHeight: 10 },
      ),
    [nodes, positions, nameLabels],
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
      <svg viewBox="0 0 480 340" className="mx-auto w-full max-w-lg" aria-label="Account relationship map">
        {links.map((link) => {
          const from = positions.get(link.from);
          const to = positions.get(link.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${link.from}-${link.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              strokeWidth={2}
              className={cn(STRENGTH_COLOR[link.strength], "opacity-70")}
            />
          );
        })}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const radius = nodeRadius(node);
          const nameLabel = nameLabels.get(`${node.id}-name`);
          const roleLabel = roleLabels.get(`${node.id}-role`);

          return (
            <g key={node.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                className={cn(
                  "fill-primary/20 stroke-primary",
                  node.id === "pg" && "fill-primary/40 stroke-primary",
                )}
                strokeWidth={2}
              />
              <text
                x={nameLabel?.x ?? pos.x}
                y={nameLabel?.y ?? pos.y + radius + 14}
                textAnchor={nameLabel?.textAnchor ?? "middle"}
                dominantBaseline={nameLabel?.dominantBaseline ?? "hanging"}
                className="fill-foreground text-[9px] font-medium"
              >
                {node.name.split(" ")[0]}
              </text>
              <text
                x={roleLabel?.x ?? pos.x}
                y={roleLabel?.y ?? pos.y + radius + 24}
                textAnchor={roleLabel?.textAnchor ?? "middle"}
                dominantBaseline={roleLabel?.dominantBaseline ?? "hanging"}
                className="fill-muted-foreground text-[8px]"
              >
                {node.role}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500" /> Strong
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-amber-500" /> Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-red-400" /> Weak
        </span>
      </div>
    </div>
  );
}
