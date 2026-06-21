interface CoverageHeatmapSkeletonProps {
  compact?: boolean;
}

export function CoverageHeatmapSkeleton({ compact }: CoverageHeatmapSkeletonProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-foreground">Coverage Heatmap</p>
          <p className="text-xs text-muted-foreground">
            Patient and provider density across the MSA
          </p>
        </div>
      )}
      <div
        className="relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30"
        aria-hidden
      >
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-1 p-3 opacity-40">
          {Array.from({ length: 24 }).map((_, index) => (
            <div
              key={index}
              className="rounded-sm bg-muted-foreground/20"
              style={{ opacity: 0.15 + (index % 5) * 0.12 }}
            />
          ))}
        </div>
        <p className="relative z-10 text-xs text-muted-foreground">
          Geographic visualization coming soon
        </p>
      </div>
    </div>
  );
}
