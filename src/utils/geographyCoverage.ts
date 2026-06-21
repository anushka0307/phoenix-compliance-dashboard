import type { MSA } from "@/types/msa";
import type {
  GeographyIndex,
  GeographyKind,
  GeographyRecord,
  StatisticalAreaProperties,
} from "@/types/geography";
import { calculateMsaMetrics } from "@/utils/calculateMsaMetrics";
import { isMsaActivated } from "@/utils/msaActivation";
import { formatCurrency } from "@/utils/format";

const MEDICARE_SHARE = 0.18;
const TAM_PER_CAPITA = 316;

export interface OpportunityMetrics {
  population: number;
  medicarePopulation: number;
  estimatedTam: number;
  estimatedPatients: number;
  estimatedPhysicianGroups: number;
  estimatedPhysicians: number;
  estimatedHhas: number;
}

export function getOpportunityMetrics(population: number): OpportunityMetrics {
  const derived = calculateMsaMetrics(population);
  return {
    population,
    medicarePopulation: Math.round(population * MEDICARE_SHARE),
    estimatedTam: Math.round(population * TAM_PER_CAPITA),
    estimatedPatients: derived.patients,
    estimatedPhysicianGroups: derived.physicianGroups,
    estimatedPhysicians: derived.physicians,
    estimatedHhas: derived.homeHealthAgencies,
  };
}

export function formatTam(value: number): string {
  return formatCurrency(value);
}

export function geographyRecordToMsaBase(record: GeographyRecord): import("@/types/msa").MsaBase {
  return {
    id: record.id,
    cbsaCode: record.cbsaCode ?? record.code,
    name: record.name,
    state: record.state,
    status: "inactive",
    population: record.population,
    revenue: 0,
    onboardingDays: 0,
    conversionRate: 0,
    churnRate: 0,
    healthScore: 0,
  };
}

export function geographyRecordToMsa(record: GeographyRecord): MSA {
  return {
    ...geographyRecordToMsaBase(record),
    patients: 0,
    physicianGroups: 0,
    physicians: 0,
    homeHealthAgencies: 0,
  };
}

/** Resolve map status from internal market database, defaulting to Inactive. */
export function resolveMarketForGeography(
  geo: GeographyRecord,
  dashboardMsas: MSA[],
  allMsas: MSA[],
): MSA {
  if (geo.kind === "msa" && geo.cbsaCode) {
    const tracked =
      dashboardMsas.find((msa) => msa.cbsaCode === geo.cbsaCode) ??
      allMsas.find((msa) => msa.cbsaCode === geo.cbsaCode);

    if (tracked && isMsaActivated(tracked)) {
      return tracked;
    }
  }

  return geographyRecordToMsa(geo);
}

export function buildGeographyLookups(
  geographies: GeographyRecord[],
  allMsas: MSA[],
  dashboardMsas: MSA[],
) {
  const dashboardByCbsa = new Map(dashboardMsas.map((msa) => [msa.cbsaCode, msa]));
  const allByCbsa = new Map(allMsas.map((msa) => [msa.cbsaCode, msa]));
  const byId = new Map<string, GeographyRecord>();
  const byCbsa = new Map<string, GeographyRecord>();
  const marketByGeographyId = new Map<string, MSA>();
  const activeByCbsa = new Map(
    allMsas.filter(isMsaActivated).map((msa) => [msa.cbsaCode, msa]),
  );

  for (const geo of geographies) {
    const market = resolveMarketForGeography(geo, dashboardMsas, allMsas);

    byId.set(geo.id, geo);
    if (geo.cbsaCode) byCbsa.set(geo.cbsaCode, geo);
    marketByGeographyId.set(geo.id, market);

    const tracked = geo.cbsaCode
      ? dashboardByCbsa.get(geo.cbsaCode) ?? allByCbsa.get(geo.cbsaCode)
      : undefined;

    if (tracked && tracked.id !== geo.id) {
      byId.set(tracked.id, geo);
      marketByGeographyId.set(tracked.id, market);
    }
  }

  for (const msa of dashboardMsas) {
    if (isMsaActivated(msa)) {
      marketByGeographyId.set(msa.id, msa);
    }
  }

  return { byId, byCbsa, marketByGeographyId, activeByCbsa, msaByCbsa: allByCbsa };
}

export function resolveCbsaGeography(
  cbsaCode: string,
  byCbsa: Map<string, GeographyRecord>,
  marketByGeographyId: Map<string, MSA>,
  censusFeature?: GeoJSON.Feature,
): { geography: GeographyRecord; market: MSA } | null {
  const existing = byCbsa.get(cbsaCode);
  if (existing) {
    const market = marketByGeographyId.get(existing.id) ?? geographyRecordToMsa(existing);
    return { geography: existing, market };
  }

  if (!censusFeature) return null;
  const record = geographyRecordFromCbsaFeature(censusFeature);
  if (!record) return null;
  return { geography: record, market: geographyRecordToMsa(record) };
}

/** Flatten MultiPolygon CBSAs so each part renders as its own SVG path. */
export function flattenCbsaGeographies(features: GeoJSON.Feature[]): GeoJSON.Feature[] {
  const flattened: GeoJSON.Feature[] = [];

  for (const feature of features) {
    const props = feature.properties as CbsaFeatureProperties | null;
    if (!props?.LSAD || (props.LSAD !== "M1" && props.LSAD !== "M2")) continue;

    if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach((coordinates, part) => {
        flattened.push({
          type: "Feature",
          properties: { ...props, _part: String(part) },
          geometry: { type: "Polygon", coordinates },
        });
      });
      continue;
    }

    flattened.push(feature);
  }

  return flattened;
}

/** Bounding-box area used to stack smaller metros above oversized simplified polygons. */
export function getGeographyBBoxArea(geometry: GeoJSON.Geometry | undefined): number {
  if (!geometry) return 0;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const coord of ring) {
        const [x, y] = coord as [number, number];
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!Number.isFinite(minX)) return 0;
  return (maxX - minX) * (maxY - minY);
}

export function getStatisticalAreaTypeLabel(kind: GeographyRecord["kind"]): string {
  switch (kind) {
    case "msa":
      return "MSA";
    case "micropolitan":
      return "Micropolitan";
    default:
      return "Statistical Area";
  }
}

export function resolveStatisticalArea(
  areaId: string,
  byId: Map<string, GeographyRecord>,
  marketByGeographyId: Map<string, MSA>,
): { geography: GeographyRecord; market: MSA } | null {
  const geography = byId.get(areaId);
  if (!geography) return null;

  const market = marketByGeographyId.get(areaId) ?? geographyRecordToMsa(geography);
  return { geography, market };
}

export async function loadStatisticalAreasGeoJson(): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch("/data/statistical-areas.geojson");
  return response.json() as Promise<GeoJSON.FeatureCollection>;
}

export interface StatisticalAreaFeature {
  type: "Feature";
  properties: StatisticalAreaProperties;
  geometry: GeoJSON.Geometry;
}

interface CbsaFeatureProperties {
  CBSAFP: string;
  NAME: string;
  NAMELSAD: string;
  LSAD: string;
  ALAND?: number;
  CSAFP?: string;
}

function parseStateFromCbsaName(name: string): string {
  const match = name.match(/,\s*([A-Z]{2})$/);
  return match?.[1] ?? "";
}

function formatCbsaDisplayName(name: string, namelsad: string): string {
  return namelsad.replace(/\s+Metro Area$/, "").replace(/\s+Micro Area$/, "").trim() || name;
}

function resolveCbsaKind(lsad: string, namelsad: string): GeographyKind | null {
  if (lsad === "M1" || /Metropolitan Statistical Area/i.test(namelsad ?? "")) return "msa";
  if (lsad === "M2" || /Micropolitan Statistical Area/i.test(namelsad ?? "")) return "micropolitan";
  return null;
}

function estimatePopulationFromLandArea(aland: number): number {
  return Math.max(5_000, Math.round(aland / 3_200));
}

function geographyRecordFromCbsaFeature(feature: GeoJSON.Feature): GeographyRecord | null {
  const props = feature.properties as CbsaFeatureProperties | null;
  if (!props?.CBSAFP) return null;

  const kind = resolveCbsaKind(props.LSAD, props.NAMELSAD);
  if (!kind) return null;

  const cbsaCode = props.CBSAFP;
  return {
    id: `${kind}-${cbsaCode}`,
    kind,
    code: cbsaCode,
    cbsaCode,
    csaCode: props.CSAFP || "",
    name: formatCbsaDisplayName(props.NAME, props.NAMELSAD),
    state: parseStateFromCbsaName(props.NAME),
    population: estimatePopulationFromLandArea(props.ALAND ?? 0),
    status: "inactive",
  };
}

/** Append Census CBSA polygons missing from the pre-built statistical-areas layer. */
export function appendMissingCbsaStatisticalAreas(
  existingAreas: StatisticalAreaFeature[],
  catalog: GeographyRecord[],
  censusGeoJson: GeoJSON.FeatureCollection,
): { areas: StatisticalAreaFeature[]; geographies: GeographyRecord[] } {
  const existingCodes = new Set(
    existingAreas
      .map((area) => area.properties.cbsaCode ?? area.properties.code)
      .filter(Boolean),
  );
  const catalogByCbsa = new Map(
    catalog.filter((geo) => geo.cbsaCode).map((geo) => [geo.cbsaCode!, geo]),
  );
  const catalogIds = new Set(catalog.map((geo) => geo.id));

  const appendedAreas: StatisticalAreaFeature[] = [];
  const appendedGeographies: GeographyRecord[] = [];

  for (const feature of censusGeoJson.features) {
    const props = feature.properties as CbsaFeatureProperties | null;
    if (!props?.CBSAFP || existingCodes.has(props.CBSAFP)) continue;

    const kind = resolveCbsaKind(props.LSAD, props.NAMELSAD);
    if (!kind) continue;

    const record = catalogByCbsa.get(props.CBSAFP) ?? geographyRecordFromCbsaFeature(feature);
    if (!record) continue;

    appendedAreas.push({
      type: "Feature",
      properties: {
        type: "statistical_area",
        ...record,
      },
      geometry: feature.geometry,
    });

    if (!catalogIds.has(record.id)) {
      appendedGeographies.push(record);
    }

    existingCodes.add(props.CBSAFP);
  }

  return {
    areas: [...existingAreas, ...appendedAreas],
    geographies: [...catalog, ...appendedGeographies],
  };
}

export function resolveCountyMarket(
  countyFips: string,
  index: GeographyIndex,
  byId: Map<string, GeographyRecord>,
  marketByGeographyId: Map<string, MSA>,
): { geography: GeographyRecord; market: MSA } | null {
  const geographyId = index.countyAssignments[countyFips];
  if (!geographyId) return null;
  return resolveStatisticalArea(geographyId, byId, marketByGeographyId);
}

export async function loadGeographyIndex(): Promise<GeographyIndex> {
  const response = await fetch("/data/geography-index.json");
  return response.json() as Promise<GeographyIndex>;
}

export async function loadGeographyCatalog(): Promise<GeographyRecord[]> {
  const response = await fetch("/data/geography-catalog.json");
  const data = (await response.json()) as { geographies: GeographyRecord[] };
  return data.geographies;
}
