import { useCallback, useMemo, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { GeographyFeature } from "react-simple-maps";
import type { MSA } from "@/types/msa";
import type { GeographyKind } from "@/types/geography";
import { MAP_STYLES } from "@/data/msaMapConfig";
import { usePortfolio } from "@/contexts/NetworkContext";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";
import { useStatisticalAreasMap } from "@/hooks/useUsCoverageMap";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/utils/format";
import {
  flattenCbsaGeographies,
  getGeographyBBoxArea,
  getOpportunityMetrics,
  getStatisticalAreaTypeLabel,
} from "@/utils/geographyCoverage";
import {
  getMsaStatusLabel,
  msaStatusMapColors,
  msaStatusMapFill,
} from "@/utils/msaStatus";
import { cn } from "@/utils/cn";

interface UsMsaMapProps {
  className?: string;
}

interface TooltipState {
  market: MSA;
  areaKind: GeographyKind;
  areaName: string;
  x: number;
  y: number;
}

const STATUS_RENDER_ORDER: Record<MSA["status"], number> = {
  inactive: 0,
  "new-market": 1,
  opportunity: 2,
  "attention-required": 3,
  growing: 4,
};

const BASE_LAYER_STYLE = {
  default: { outline: "none", fillOpacity: 1 },
  hover: { outline: "none" },
  pressed: { outline: "none" },
} as const;

function cbsaKindFromLsad(lsad: string): GeographyKind {
  return lsad === "M1" ? "msa" : "micropolitan";
}

function geographyKey(geo: GeographyFeature, cbsaCode: string): string {
  return `${cbsaCode}-${geo.properties._part ?? "0"}-${geo.rsmKey}`;
}

/** Largest areas first so every statistical area paints underneath smaller neighbors. */
function sortForVisibility(geographies: GeographyFeature[]): GeographyFeature[] {
  return [...geographies].sort((a, b) => {
    const aArea = getGeographyBBoxArea(a.geometry as GeoJSON.Geometry | undefined);
    const bArea = getGeographyBBoxArea(b.geometry as GeoJSON.Geometry | undefined);
    return bArea - aArea;
  });
}

function sortInteractiveGeographies(
  geographies: GeographyFeature[],
  highlightedCbsaCodes: Set<string>,
  resolveByCbsa: (cbsaCode: string) => { market: MSA } | null,
) {
  return [...geographies].sort((a, b) => {
    const aCode = a.properties.CBSAFP as string;
    const bCode = b.properties.CBSAFP as string;

    const aHighlighted = highlightedCbsaCodes.has(aCode);
    const bHighlighted = highlightedCbsaCodes.has(bCode);
    if (aHighlighted !== bHighlighted) return aHighlighted ? 1 : -1;

    const aStatus = resolveByCbsa(aCode)?.market.status ?? "inactive";
    const bStatus = resolveByCbsa(bCode)?.market.status ?? "inactive";
    if (STATUS_RENDER_ORDER[aStatus] !== STATUS_RENDER_ORDER[bStatus]) {
      return STATUS_RENDER_ORDER[aStatus] - STATUS_RENDER_ORDER[bStatus];
    }

    const aArea = getGeographyBBoxArea(a.geometry as GeoJSON.Geometry | undefined);
    const bArea = getGeographyBBoxArea(b.geometry as GeoJSON.Geometry | undefined);
    return bArea - aArea;
  });
}

function darkenFill(hex: string, amount = 0.12): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = Math.max(0, parseInt(normalized.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(normalized.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(normalized.slice(4, 6), 16) * (1 - amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export function UsMsaMap({ className }: UsMsaMapProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { pulsingMsaId } = usePortfolio();
  const { geoData, loaded, resolveByCbsa } = useStatisticalAreasMap();
  const {
    selectedMsaId,
    hoveredMsaId,
    setHoveredMsaId,
    recordRecentMsa,
    openActivation,
  } = useMsaNavigation();

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const highlightedCbsaCodes = useMemo(() => {
    const codes = new Set<string>();
    const targetId = hoveredMsaId ?? selectedMsaId;
    if (!targetId || !geoData) return codes;

    for (const feature of geoData.features) {
      const cbsaCode = (feature.properties as { CBSAFP?: string } | null)?.CBSAFP;
      if (!cbsaCode) continue;
      const resolved = resolveByCbsa(cbsaCode, feature);
      if (resolved?.market.id === targetId) {
        codes.add(cbsaCode);
      }
    }
    return codes;
  }, [geoData, hoveredMsaId, selectedMsaId, resolveByCbsa]);

  const handleMarketClick = useCallback(
    (market: MSA) => {
      recordRecentMsa(market.id);
      navigate(`/msa/${market.id}`);
    },
    [navigate, recordRecentMsa],
  );

  const updateTooltip = useCallback(
    (
      market: MSA,
      areaKind: GeographyKind,
      areaName: string,
      event: MouseEvent,
    ) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setTooltip({
        market,
        areaKind,
        areaName,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      setHoveredMsaId(market.id);
    },
    [setHoveredMsaId],
  );

  const clearMapHover = useCallback(() => {
    setTooltip(null);
    setHoveredMsaId(null);
  }, [setHoveredMsaId]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden rounded-xl", MAP_STYLES.background, className)}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-2 px-3 py-2">
        <div className="flex flex-wrap justify-end gap-2 text-[11px] text-muted-foreground">
          {(Object.keys(msaStatusMapColors) as MSA["status"][]).map((status) => (
            <span key={status} className="flex items-center gap-1.5 rounded-md bg-card/90 px-1.5 py-0.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: msaStatusMapColors[status] }}
              />
              {getMsaStatusLabel(status)}
            </span>
          ))}
        </div>
      </div>

      {!loaded && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-slate-50/80">
          <p className="text-sm text-muted-foreground">Loading statistical areas…</p>
        </div>
      )}

      {loaded && geoData && (
        <ComposableMap
          projection="geoAlbersUsa"
          className="h-full w-full"
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoData} parseGeographies={flattenCbsaGeographies}>
            {({ geographies }) => {
              const visibilityLayer = sortForVisibility(geographies);
              const interactiveLayer = sortInteractiveGeographies(
                geographies.filter((geo) => geo.properties.LSAD === "M1"),
                highlightedCbsaCodes,
                resolveByCbsa,
              );

              return (
                <>
                  <g aria-hidden style={{ pointerEvents: "none" }}>
                    {visibilityLayer.map((geo) => {
                      const cbsaCode = geo.properties.CBSAFP as string;
                      return (
                        <Geography
                          key={`base-${geographyKey(geo, cbsaCode)}`}
                          geography={geo}
                          fill={MAP_STYLES.statisticalArea.fill}
                          stroke={MAP_STYLES.statisticalArea.stroke}
                          strokeWidth={MAP_STYLES.statisticalArea.strokeWidth}
                          style={BASE_LAYER_STYLE}
                        />
                      );
                    })}
                  </g>

                  {interactiveLayer.map((geo) => {
                    const cbsaCode = geo.properties.CBSAFP as string;
                    const lsad = geo.properties.LSAD as string;
                    const resolved = resolveByCbsa(cbsaCode, geo as unknown as GeoJSON.Feature);
                    if (!resolved) return null;

                    const { geography, market } = resolved;
                    const areaKind = geography.kind ?? cbsaKindFromLsad(lsad);
                    const status = market.status;
                    const isSelected = market.id === selectedMsaId;
                    const isHovered = market.id === hoveredMsaId;
                    const isPulsing = market.id === pulsingMsaId;
                    const fill = msaStatusMapFill[status];
                    const areaName = geography.name;

                    return (
                      <Geography
                        key={`interactive-${geographyKey(geo, cbsaCode)}`}
                        geography={geo}
                        fill={fill}
                        stroke={
                          isSelected
                            ? "#0f172a"
                            : isHovered
                              ? "#475569"
                              : MAP_STYLES.statisticalArea.stroke
                        }
                        strokeWidth={
                          isSelected
                            ? 2
                            : isHovered
                              ? MAP_STYLES.portfolio.hoverStrokeWidth
                              : MAP_STYLES.statisticalArea.strokeWidth
                        }
                        className={cn(isPulsing && "msa-activate-pulse")}
                        style={{
                          default: {
                            outline: "none",
                            fillOpacity: status === "inactive" ? 0.92 : 0.95,
                            transition:
                              "fill 300ms ease, stroke 150ms ease, fill-opacity 150ms ease",
                          },
                          hover: {
                            outline: "none",
                            cursor: "pointer",
                            fill: darkenFill(fill),
                            fillOpacity: 1,
                            stroke: "#475569",
                            strokeWidth: MAP_STYLES.portfolio.hoverStrokeWidth,
                          },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(event) =>
                          updateTooltip(market, areaKind, areaName, event)
                        }
                        onMouseMove={(event) => updateTooltip(market, areaKind, areaName, event)}
                        onMouseLeave={clearMapHover}
                        onClick={() => handleMarketClick(market)}
                      />
                    );
                  })}
                </>
              );
            }}
          </Geographies>
        </ComposableMap>
      )}

      {tooltip && (
        <div
          className="pointer-events-auto absolute z-20 w-56 rounded-lg bg-foreground px-3 py-2.5 text-background shadow-xl"
          style={{
            left: Math.min(
              Math.max(tooltip.x + 14, 8),
              (containerRef.current?.clientWidth ?? 400) - 232,
            ),
            top: Math.max(tooltip.y - 12, 44),
            transform: "translateY(-100%)",
          }}
        >
          <p className="text-xs font-semibold leading-snug">
            {tooltip.areaName}
            {tooltip.market.state ? `, ${tooltip.market.state}` : ""}
          </p>
          <div className="mt-2 space-y-1 text-[11px] opacity-90">
            <p>Type: {getStatisticalAreaTypeLabel(tooltip.areaKind)}</p>
            <p>Status: {getMsaStatusLabel(tooltip.market.status)}</p>
            <p>Population: {formatNumber(tooltip.market.population)}</p>
            <p>
              Est. TAM:{" "}
              {formatCurrency(getOpportunityMetrics(tooltip.market.population).estimatedTam)}
            </p>
          </div>
          {tooltip.market.status === "inactive" && (
            <Button
              size="sm"
              className="mt-2 h-7 w-full text-xs"
              onClick={() => {
                openActivation(tooltip.market);
                clearMapHover();
              }}
            >
              Activate Market
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
