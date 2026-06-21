import type { MsaBase } from "@/types/msa";
import { CBSA_GEOJSON_URL } from "@/data/msaMapConfig";

interface CbsaFeatureProperties {
  CBSAFP: string;
  NAME: string;
  NAMELSAD: string;
  LSAD: string;
  ALAND: number;
}

interface CbsaFeatureCollection {
  type: "FeatureCollection";
  features: Array<{ properties: CbsaFeatureProperties }>;
}

export function slugifyMsaId(name: string): string {
  return name
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseStateFromCbsaName(name: string): string {
  const match = name.match(/,\s*([A-Z]{2})$/);
  return match?.[1] ?? "";
}

export function formatMetroName(name: string, namelsad: string): string {
  return namelsad.replace(/\s+Metro Area$/, "").trim() || name;
}

export function estimatePopulationFromAland(aland: number): number {
  return Math.max(50_000, Math.round(aland / 3_200));
}

export function cbsaFeatureToMsaBase(feature: { properties: CbsaFeatureProperties }): MsaBase {
  const { CBSAFP, NAME, NAMELSAD, ALAND } = feature.properties;
  const displayName = formatMetroName(NAME, NAMELSAD);
  const state = parseStateFromCbsaName(NAME);

  return {
    id: slugifyMsaId(displayName),
    cbsaCode: CBSAFP,
    name: displayName,
    state,
    status: "inactive",
    population: estimatePopulationFromAland(ALAND),
    revenue: 0,
    onboardingDays: 0,
    conversionRate: 0,
    churnRate: 0,
    healthScore: 0,
  };
}

let catalogCache: MsaBase[] | null = null;

export async function loadMetropolitanCbsaCatalog(): Promise<MsaBase[]> {
  if (catalogCache) return catalogCache;

  const response = await fetch(CBSA_GEOJSON_URL);
  const data = (await response.json()) as CbsaFeatureCollection;

  catalogCache = data.features
    .filter((feature) => feature.properties.LSAD === "M1")
    .map(cbsaFeatureToMsaBase)
    .sort((a, b) => a.name.localeCompare(b.name));

  return catalogCache;
}
