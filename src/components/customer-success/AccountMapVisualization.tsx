import type { CsPersonaLink, CsPersonaNode } from "@/types/customerSuccess";
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

const CATEGORY_POSITION: Record<string, { x: number; y: number }> = {
  pg: { x: 200, y: 140 },
  clinical: { x: 120, y: 60 },
  operations: { x: 300, y: 60 },
  financial: { x: 60, y: 200 },
  executive: { x: 340, y: 200 },
  technical: { x: 200, y: 260 },
};

export function AccountMapVisualization({ nodes, links }: AccountMapVisualizationProps) {
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, index) => {
    if (node.id === "pg") {
      positions.set(node.id, CATEGORY_POSITION.pg);
      return;
    }
    const base = CATEGORY_POSITION[node.category] ?? { x: 100 + index * 40, y: 100 };
    positions.set(node.id, base);
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
      <svg viewBox="0 0 400 300" className="mx-auto w-full max-w-lg" aria-label="Account relationship map">
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
          const radius = 12 + node.influenceScore / 12;
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
                x={pos.x}
                y={pos.y + radius + 14}
                textAnchor="middle"
                className="fill-foreground text-[9px] font-medium"
              >
                {node.name.split(" ")[0]}
              </text>
              <text
                x={pos.x}
                y={pos.y + radius + 24}
                textAnchor="middle"
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
