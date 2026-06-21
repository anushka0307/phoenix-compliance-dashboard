import type { CountyCoverageRow, ZipHeatmapCell } from "@/types/marketAnalysis";
import { heatmapColor } from "@/components/market-analysis/charts/chartColors";
import { formatCurrency, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface CountyChoroplethProps {
  counties: CountyCoverageRow[];
  zipCells: ZipHeatmapCell[];
}

export function CountyChoropleth({ counties, zipCells }: CountyChoroplethProps) {
  const countyZips = counties.map((county) => ({
    county,
    zips: zipCells.filter((z) => z.county === county.county),
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countyZips.map(({ county, zips }) => {
          const avgGap =
            zips.length > 0
              ? zips.reduce((sum, z) => sum + z.coverageGap, 0) / zips.length
              : county.opportunityValue / 10_000;
          const covered = zips.filter((z) => z.isCovered).length;
          const fill = heatmapColor(avgGap, covered > zips.length / 2);

          return (
            <div
              key={county.county}
              className="rounded-lg border border-border bg-card p-3"
              title={`${county.county}: PG ${formatPercent(county.pgPenetration)}, Reach ${formatPercent(county.patientReach)}, Opportunity ${formatCurrency(county.opportunityValue)}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{county.county}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(county.opportunityValue)}
                </span>
              </div>
              <div
                className="mb-2 rounded-md border border-border/50 p-2"
                style={{ backgroundColor: fill }}
              >
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(6, Math.max(3, zips.length))}, minmax(0, 1fr))`,
                  }}
                >
                  {zips.slice(0, 18).map((cell) => (
                    <div
                      key={cell.zip}
                      title={`ZIP ${cell.zip}\nPG: ${formatPercent(cell.pgPenetration)}\nReach: ${formatPercent(cell.patientReach)}\nOpportunity: ${formatCurrency(cell.opportunityValue)}\nCompetitor density: ${formatPercent(cell.competitorDensity)}`}
                      className={cn(
                        "aspect-square rounded-[2px] border border-white/20",
                        "transition-transform hover:scale-125 hover:z-10",
                      )}
                      style={{ backgroundColor: heatmapColor(cell.coverageGap, cell.isCovered) }}
                    />
                  ))}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                <div>
                  <dt>PG penetration</dt>
                  <dd className="font-medium text-foreground">{formatPercent(county.pgPenetration)}</dd>
                </div>
                <div>
                  <dt>Patient reach</dt>
                  <dd className="font-medium text-foreground">{formatPercent(county.patientReach)}</dd>
                </div>
                <div>
                  <dt>ZIPs covered</dt>
                  <dd className="font-medium text-foreground">
                    {covered}/{zips.length || "—"}
                  </dd>
                </div>
                <div>
                  <dt>Uncovered ZIPs</dt>
                  <dd className="font-medium text-foreground">{county.uncoveredZips}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-emerald-500/70" /> Covered
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-blue-500/70" /> Opportunity
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-amber-500/70" /> Caution
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-sm bg-red-500/70" /> Risk
        </span>
      </div>
    </div>
  );
}
