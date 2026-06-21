import type { ZipHeatmapCell } from "@/types/marketAnalysis";
import { heatmapColor } from "@/components/market-analysis/charts/chartColors";

interface ZipHeatmapProps {
  cells: ZipHeatmapCell[];
  columns?: number;
}

export function ZipHeatmap({ cells, columns = 8 }: ZipHeatmapProps) {
  return (
    <div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => (
          <div
            key={cell.zip}
            title={`${cell.zip} · ${cell.county} · gap ${cell.coverageGap}%`}
            className="aspect-square rounded-sm border border-border/40 transition-transform hover:scale-105"
            style={{ backgroundColor: heatmapColor(cell.coverageGap, cell.isCovered) }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Low gap (covered)</span>
        <div className="flex h-2 w-32 overflow-hidden rounded-full">
          <div className="flex-1 bg-emerald-400/70" />
          <div className="flex-1 bg-amber-400/70" />
          <div className="flex-1 bg-red-500/70" />
        </div>
        <span>High gap (uncovered)</span>
      </div>
    </div>
  );
}
