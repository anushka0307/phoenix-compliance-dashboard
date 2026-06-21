import type { MsaClient, MsaCountyRegion, MsaHhaLocation, TerritoryProvider } from "@/types/msaWorkspace";
import type { MsaCountyFeature } from "@/utils/msaCountyMapData";

export type { TerritoryProvider };

export interface FeatureBbox {
  west: number;
  south: number;
  east: number;
  north: number;
  center: [number, number];
}

export function getFeatureBbox(geometry: {
  type: string;
  coordinates: unknown;
}): FeatureBbox {
  const points: [number, number][] = [];

  const walk = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      points.push([coords[0], coords[1]]);
      return;
    }
    coords.forEach(walk);
  };

  walk(geometry.coordinates);

  if (points.length === 0) {
    return { west: -85, south: 33, east: -84, north: 34, center: [-84.5, 33.5] };
  }

  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);

  return {
    west,
    south,
    east,
    north,
    center: [(west + east) / 2, (south + north) / 2],
  };
}

/** Fit the MSA polygon to ~80% of the map viewport (75–85% target). */
export function computeFitZoom(
  bbox: FeatureBbox,
  width: number,
  height: number,
  padding = 40,
): number {
  const lngSpan = Math.max(bbox.east - bbox.west, 0.05);
  const latSpan = Math.max(bbox.north - bbox.south, 0.05);
  const fill = 0.8;
  const usableW = Math.max(width - padding * 2, 120) * fill;
  const usableH = Math.max(height - padding * 2, 120) * fill;
  const zoomFromLng = usableW / (lngSpan * 95);
  const zoomFromLat = usableH / (latSpan * 95);
  return Math.max(3.5, Math.min(zoomFromLng, zoomFromLat) * 5.5);
}

export function assignCountyName(
  coordinates: [number, number],
  center: [number, number],
  counties: MsaCountyRegion[],
): string {
  if (counties.length === 0) return "Unknown";
  const angle = Math.atan2(coordinates[1] - center[1], coordinates[0] - center[0]);
  const normalized = (angle + Math.PI) / (Math.PI * 2);
  const index = Math.min(counties.length - 1, Math.floor(normalized * counties.length));
  return counties[index]?.name ?? "Unknown";
}

export function buildTerritoryProviders(
  clients: MsaClient[],
  hhas: MsaHhaLocation[],
  counties: MsaCountyRegion[],
  center: [number, number],
): TerritoryProvider[] {
  const pgProviders: TerritoryProvider[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    type: "pg",
    coordinates: client.coordinates,
    county: assignCountyName(client.coordinates, center, counties),
    patients: client.patients,
    status:
      client.health === "healthy"
        ? "Active"
        : client.health === "attention"
          ? "Needs attention"
          : "At risk",
    client,
  }));

  const hhaProviders: TerritoryProvider[] = hhas.map((hha) => ({
    id: hha.id,
    name: hha.name,
    type: "hha",
    coordinates: hha.coordinates,
    county: assignCountyName(hha.coordinates, center, counties),
    patients: hha.patients,
    status: "Active",
  }));

  return [...pgProviders, ...hhaProviders];
}

export function mapClusterZoomToMapZoom(clusterZoom: number, baseZoom: number): number {
  return (clusterZoom - 4) / 2.4 + baseZoom;
}

export function mapZoomToClusterZoom(mapZoom: number, baseZoom: number): number {
  const relative = (mapZoom - baseZoom) * 2.4 + 4;
  return Math.round(Math.min(10, Math.max(0, relative)));
}

function jitterCoordinate(
  centroid: [number, number],
  index: number,
  spread = 0.035,
): [number, number] {
  const angle = index * 2.399963;
  const radius = spread * (0.35 + (index % 5) * 0.12);
  return [
    centroid[0] + Math.cos(angle) * radius,
    centroid[1] + Math.sin(angle) * radius * 0.72,
  ];
}

export function buildTerritoryProvidersForCounties(
  clients: MsaClient[],
  hhas: MsaHhaLocation[],
  counties: MsaCountyFeature[],
): TerritoryProvider[] {
  if (counties.length === 0) {
    return buildTerritoryProviders(clients, hhas, [], [0, 0]);
  }

  const pgProviders: TerritoryProvider[] = clients.map((client, index) => {
    const county = counties[index % counties.length];
    const coordinates = jitterCoordinate(county.centroid, index, 0.028);
    return {
      id: client.id,
      name: client.name,
      type: "pg",
      coordinates,
      county: county.name,
      patients: client.patients,
      status:
        client.health === "healthy"
          ? "Active"
          : client.health === "attention"
            ? "Needs attention"
            : "At risk",
      client,
    };
  });

  const hhaProviders: TerritoryProvider[] = hhas.map((hha, index) => {
    const county = counties[(index + Math.floor(clients.length / 2)) % counties.length];
    const coordinates = jitterCoordinate(county.centroid, index + 7, 0.022);
    return {
      id: hha.id,
      name: hha.name,
      type: "hha",
      coordinates,
      county: county.name,
      patients: hha.patients,
      status: "Active",
    };
  });

  return [...pgProviders, ...hhaProviders];
}

export function getClusterTypeLabel(
  index: SuperclusterIndex,
  clusterId: number,
): string {
  const leaves = index.getLeaves(clusterId, Infinity);
  const pgCount = leaves.filter((leaf) => leaf.properties.type === "pg").length;
  const hhaCount = leaves.filter((leaf) => leaf.properties.type === "hha").length;
  const parts: string[] = [];
  if (pgCount > 0) parts.push(`${pgCount} PG${pgCount === 1 ? "" : "s"}`);
  if (hhaCount > 0) parts.push(`${hhaCount} HHA${hhaCount === 1 ? "" : "s"}`);
  return parts.join("\n");
}

type SuperclusterIndex = {
  getLeaves: (clusterId: number, limit: number) => Array<{ properties: TerritoryProvider }>;
};

export function spiderfyCoordinates(
  origin: [number, number],
  count: number,
  spread = 0.018,
): [number, number][] {
  if (count <= 1) return [origin];
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return [
      origin[0] + Math.cos(angle) * spread,
      origin[1] + Math.sin(angle) * spread * 0.72,
    ] as [number, number];
  });
}

export function offsetCoordinates(
  coordinates: [number, number],
  index: number,
  total: number,
): [number, number] {
  if (total <= 1) return coordinates;
  const golden = index * 2.399963;
  const radius = 0.004 + (index % 7) * 0.0008;
  return [
    coordinates[0] + Math.cos(golden) * radius,
    coordinates[1] + Math.sin(golden) * radius * 0.7,
  ];
}
