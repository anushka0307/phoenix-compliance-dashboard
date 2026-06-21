import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import {
  CBSA_COUNTY_CROSSWALK_URL,
  COUNTIES_TOPOJSON_URL,
} from "@/data/msaMapConfig";
import { getFeatureBbox } from "@/utils/msaTerritoryMapUtils";

export interface MsaCountyFeature {
  id: string;
  name: string;
  geometry: Geometry;
  centroid: [number, number];
}

let countyFipsByCbsa: Map<string, string[]> | null = null;
let countiesTopology: Topology | null = null;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

async function loadCountyFipsByCbsa(): Promise<Map<string, string[]>> {
  if (countyFipsByCbsa) return countyFipsByCbsa;

  const text = await fetch(CBSA_COUNTY_CROSSWALK_URL).then((response) => response.text());
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const cbsaIndex = headers.indexOf("cbsacode");
  const fipsIndex = headers.indexOf("county_fips");
  const inCbsaIndex = headers.indexOf("county_in_cbsa");

  const byCbsa = new Map<string, Set<string>>();

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const cbsaCode = values[cbsaIndex]?.replace(/"/g, "").trim();
    const countyFips = values[fipsIndex]?.replace(/"/g, "").trim();
    const inCbsa = values[inCbsaIndex]?.replace(/"/g, "").trim();

    if (!cbsaCode || !countyFips || inCbsa !== "1") continue;

    if (!byCbsa.has(cbsaCode)) byCbsa.set(cbsaCode, new Set());
    byCbsa.get(cbsaCode)!.add(countyFips.padStart(5, "0"));
  }

  countyFipsByCbsa = new Map(
    [...byCbsa.entries()].map(([code, fipsSet]) => [code, [...fipsSet]]),
  );
  return countyFipsByCbsa;
}

async function loadCountiesTopology(): Promise<Topology> {
  if (countiesTopology) return countiesTopology;
  countiesTopology = (await fetch(COUNTIES_TOPOJSON_URL).then((response) =>
    response.json(),
  )) as Topology;
  return countiesTopology;
}

export async function loadMsaCountyFeatures(cbsaCode: string): Promise<MsaCountyFeature[]> {
  const [fipsByCbsa, topology] = await Promise.all([
    loadCountyFipsByCbsa(),
    loadCountiesTopology(),
  ]);

  const countyFips = new Set(fipsByCbsa.get(cbsaCode) ?? []);
  if (countyFips.size === 0) return [];

  const allCounties = feature(
    topology,
    topology.objects.counties as Parameters<typeof feature>[1],
  ) as FeatureCollection;

  return allCounties.features
    .filter((county) => countyFips.has(String(county.id ?? "")))
    .map((county) => {
      const id = String(county.id ?? "");
      const name = (county.properties as { name?: string } | null)?.name ?? id;
      const bbox = getFeatureBbox(county.geometry as { type: string; coordinates: unknown });
      return {
        id,
        name,
        geometry: county.geometry,
        centroid: bbox.center,
      };
    });
}

export function countiesToFeatureCollection(
  counties: MsaCountyFeature[],
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: counties.map((county) => ({
      type: "Feature",
      id: county.id,
      properties: { name: county.name, GEOID: county.id },
      geometry: county.geometry,
    })),
  };
}
