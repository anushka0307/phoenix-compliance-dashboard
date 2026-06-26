export interface LayoutPoint {
  id: string;
  x: number;
  y: number;
}

export interface LabelPlacement {
  id: string;
  x: number;
  y: number;
  textAnchor?: "start" | "middle" | "end";
  dominantBaseline?: "auto" | "middle" | "hanging";
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlap(a: Rect, b: Rect, padding = 4): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

export function estimateTextWidth(text: string, fontSize = 9): number {
  const displayLength = text.length > 20 ? 20 : text.length;
  return displayLength * fontSize * 0.55;
}

/** Push overlapping circular nodes apart while keeping them inside bounds. */
export function separateOverlappingNodes(
  nodes: Array<LayoutPoint & { radius: number }>,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  iterations = 24,
): Map<string, { x: number; y: number }> {
  const positions = nodes.map((node) => ({ ...node }));

  for (let pass = 0; pass < iterations; pass += 1) {
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const a = positions[i];
        const b = positions[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = a.radius + b.radius + 10;
        if (dist >= minDist) continue;

        const push = ((minDist - dist) / dist) * 0.55;
        const ox = dx * push;
        const oy = dy * push;
        a.x -= ox;
        a.y -= oy;
        b.x += ox;
        b.y += oy;
      }
    }

    positions.forEach((node) => {
      node.x = Math.min(bounds.maxX - node.radius, Math.max(bounds.minX + node.radius, node.x));
      node.y = Math.min(bounds.maxY - node.radius, Math.max(bounds.minY + node.radius, node.y));
    });
  }

  return new Map(positions.map((node) => [node.id, { x: node.x, y: node.y }]));
}

const LABEL_OFFSETS = [
  { dx: 0, dy: 0, textAnchor: "middle" as const, dominantBaseline: "hanging" as const },
  { dx: 0, dy: -14, textAnchor: "middle" as const, dominantBaseline: "auto" as const },
  { dx: 14, dy: 0, textAnchor: "start" as const, dominantBaseline: "middle" as const },
  { dx: -14, dy: 0, textAnchor: "end" as const, dominantBaseline: "middle" as const },
  { dx: 12, dy: 12, textAnchor: "start" as const, dominantBaseline: "hanging" as const },
  { dx: -12, dy: 12, textAnchor: "end" as const, dominantBaseline: "hanging" as const },
  { dx: 0, dy: 16, textAnchor: "middle" as const, dominantBaseline: "hanging" as const },
  { dx: 0, dy: -24, textAnchor: "middle" as const, dominantBaseline: "auto" as const },
];

/** Resolve label overlaps by trying small offsets around each anchor point. */
export function resolveLabelCollisions(
  labels: Array<{ id: string; anchorX: number; anchorY: number; text: string }>,
  options?: { fontSize?: number; labelHeight?: number },
): Map<string, LabelPlacement> {
  const fontSize = options?.fontSize ?? 9;
  const labelHeight = options?.labelHeight ?? 12;
  const placed: Rect[] = [];
  const result = new Map<string, LabelPlacement>();

  labels.forEach((label) => {
    const width = estimateTextWidth(label.text, fontSize);

    for (const offset of LABEL_OFFSETS) {
      const x = label.anchorX + offset.dx - width / 2;
      const y =
        offset.dominantBaseline === "auto"
          ? label.anchorY + offset.dy - labelHeight
          : label.anchorY + offset.dy;
      const candidate: Rect = { x, y, width, height: labelHeight };
      const collides = placed.some((rect) => rectsOverlap(rect, candidate));
      if (!collides) {
        placed.push(candidate);
        result.set(label.id, {
          id: label.id,
          x: label.anchorX + offset.dx,
          y: label.anchorY + offset.dy,
          textAnchor: offset.textAnchor,
          dominantBaseline: offset.dominantBaseline,
        });
        return;
      }
    }

    placed.push({
      x: label.anchorX - width / 2,
      y: label.anchorY,
      width,
      height: labelHeight,
    });
    result.set(label.id, {
      id: label.id,
      x: label.anchorX,
      y: label.anchorY + 20,
      textAnchor: "middle",
      dominantBaseline: "hanging",
    });
  });

  return result;
}
