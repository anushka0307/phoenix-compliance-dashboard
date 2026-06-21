/** Semantic color scale for market analysis visualizations */

export type CoverageSemantic = "positive" | "opportunity" | "caution" | "risk" | "neutral";

export function semanticColor(kind: CoverageSemantic, intensity = 0.7): string {
  const alpha = 0.35 + Math.min(1, intensity) * 0.55;
  switch (kind) {
    case "positive":
      return `rgba(16, 185, 129, ${alpha})`;
    case "opportunity":
      return `rgba(59, 130, 246, ${alpha})`;
    case "caution":
      return `rgba(245, 158, 11, ${alpha})`;
    case "risk":
      return `rgba(239, 68, 68, ${alpha})`;
    default:
      return `rgba(148, 163, 184, ${alpha})`;
  }
}

export function coverageGapSemantic(gap: number, isCovered: boolean): CoverageSemantic {
  if (isCovered && gap < 25) return "positive";
  if (!isCovered && gap >= 60) return "risk";
  if (!isCovered) return "opportunity";
  if (gap >= 40) return "caution";
  return "neutral";
}

export function heatmapColor(gap: number, isCovered: boolean): string {
  const kind = coverageGapSemantic(gap, isCovered);
  const intensity = gap / 100;
  return semanticColor(kind, intensity);
}

export const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
  "#ef4444",
] as const;
