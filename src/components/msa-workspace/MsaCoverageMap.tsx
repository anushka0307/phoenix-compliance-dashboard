import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import type { GeographyFeature } from "react-simple-maps";
import type { MSA } from "@/types/msa";
import type { MapLayerId, MsaClient } from "@/types/msaWorkspace";
import { CBSA_GEOJSON_URL, MAP_STYLES } from "@/data/msaMapConfig";
import { ClientDetailPanel } from "@/components/msa-workspace/ClientDetailPanel";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import {
  clientMarkerColor,
  clientMarkerRadius,
  estimateMapZoom,
  generateMsaClients,
  getFeatureBboxCenter,
} from "@/utils/msaWorkspaceHelpers";
import { cn } from "@/utils/cn";

interface CbsaFeatureCollection {
  type: "FeatureCollection";
  features: GeographyFeature[];
}

const LAYER_OPTIONS: { id: MapLayerId; label: string }[] = [
  { id: "counties", label: "County boundaries" },
  { id: "zipHeatmap", label: "ZIP code heatmap" },
  { id: "physicianDensity", label: "Physician density" },
  { id: "hhaDensity", label: "Home health agency density" },
];

interface MsaCoverageMapProps {
  msa: MSA;
  className?: string;
}

export function MsaCoverageMap({ msa, className }: MsaCoverageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<CbsaFeatureCollection | null>(null);
  const [layers, setLayers] = useState<Record<MapLayerId, boolean>>({
    counties: false,
    zipHeatmap: false,
    physicianDensity: false,
    hhaDensity: false,
    existingClients: true,
  });
  const [hoveredClient, setHoveredClient] = useState<MsaClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<MsaClient | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    fetch(CBSA_GEOJSON_URL)
      .then((response) => response.json())
      .then((data: CbsaFeatureCollection) => {
        if (!cancelled) setGeoData(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const msaFeature = useMemo(() => {
    if (!geoData) return null;
    return (
      geoData.features.find((feature) => feature.properties.CBSAFP === msa.cbsaCode) ?? null
    );
  }, [geoData, msa.cbsaCode]);

  const center = useMemo(() => {
    if (!msaFeature?.geometry) return [-84.5, 33.7] as [number, number];
    return getFeatureBboxCenter(msaFeature.geometry as { type: string; coordinates: unknown });
  }, [msaFeature]);

  const clients = useMemo(
    () => (msaFeature ? generateMsaClients(msa, center) : []),
    [msa, center, msaFeature],
  );

  const maxPatients = useMemo(
    () => Math.max(...clients.map((c) => c.patients), 1),
    [clients],
  );

  const zoom = estimateMapZoom(msa.population);

  const toggleLayer = (id: MapLayerId) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateTooltip = useCallback((client: MsaClient, event: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoveredClient(client);
    setTooltipPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Market Coverage</h2>
          <p className="text-sm text-muted-foreground">
            Where we operate inside this market
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LAYER_OPTIONS.map((layer) => (
            <Button
              key={layer.id}
              type="button"
              size="sm"
              variant={layers[layer.id] ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => toggleLayer(layer.id)}
            >
              {layer.label}
            </Button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative min-h-[420px] w-full overflow-hidden rounded-xl lg:min-h-[480px]",
          MAP_STYLES.background,
          className,
        )}
      >
        {!geoData && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading market boundary…</p>
          </div>
        )}

        {layers.zipHeatmap && msaFeature && (
          <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-br from-amber-200/20 via-transparent to-primary/15" />
        )}

        {geoData && msaFeature && (
          <ComposableMap
            projection="geoAlbersUsa"
            className="h-full w-full"
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup center={center} zoom={zoom} minZoom={zoom - 1} maxZoom={zoom + 3}>
              <Geographies geography={geoData}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => geo.properties.CBSAFP === msa.cbsaCode)
                    .map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#e8f0ea"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                      />
                    ))
                }
              </Geographies>

              {layers.counties && (
                <Geographies geography={geoData}>
                  {({ geographies }) =>
                    geographies
                      .filter((geo) => geo.properties.CBSAFP === msa.cbsaCode)
                      .map((geo) => (
                        <Geography
                          key={`county-${geo.rsmKey}`}
                          geography={geo}
                          fill="transparent"
                          stroke="#64748b"
                          strokeWidth={0.4}
                          strokeDasharray="2 2"
                          style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                        />
                      ))
                  }
                </Geographies>
              )}

              {layers.physicianDensity &&
                clients.slice(0, 12).map((client) => (
                  <Marker key={`pg-${client.id}`} coordinates={client.coordinates}>
                    <circle r={2} fill="#3b82f6" opacity={0.35} />
                  </Marker>
                ))}

              {layers.hhaDensity &&
                clients.slice(0, 12).map((client) => (
                  <Marker
                    key={`hha-${client.id}`}
                    coordinates={[
                      client.coordinates[0] + 0.05,
                      client.coordinates[1] - 0.04,
                    ]}
                  >
                    <circle r={2} fill="#8b5cf6" opacity={0.35} />
                  </Marker>
                ))}

              {clients.map((client) => (
                <Marker key={client.id} coordinates={client.coordinates}>
                  <circle
                    r={clientMarkerRadius(client.patients, maxPatients)}
                    fill={clientMarkerColor(client.health)}
                    fillOpacity={0.85}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(event) => updateTooltip(client, event)}
                    onMouseMove={(event) => updateTooltip(client, event)}
                    onMouseLeave={() => setHoveredClient(null)}
                    onClick={() => setSelectedClient(client)}
                  />
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        )}

        {hoveredClient && !selectedClient && (
          <div
            className="pointer-events-none absolute z-20 w-52 rounded-lg bg-foreground px-3 py-2.5 text-background shadow-xl"
            style={{
              left: Math.min(
                Math.max(tooltipPos.x + 12, 8),
                (containerRef.current?.clientWidth ?? 400) - 220,
              ),
              top: Math.max(tooltipPos.y - 8, 8),
              transform: "translateY(-100%)",
            }}
          >
            <p className="text-xs font-semibold">{hoveredClient.name}</p>
            <div className="mt-1.5 space-y-0.5 text-[11px] opacity-90">
              <p>Patients: {formatNumber(hoveredClient.patients)}</p>
              <p>Revenue: {formatCurrency(hoveredClient.revenue)}</p>
              <p>Retention: {formatPercent(hoveredClient.retention)}</p>
              <p>HHAs: {hoveredClient.homeHealthAgencies}</p>
            </div>
          </div>
        )}
      </div>

      <ClientDetailPanel client={selectedClient} onClose={() => setSelectedClient(null)} />
    </section>
  );
}
