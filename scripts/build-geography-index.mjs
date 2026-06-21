import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../public/data");

function parseCsvLine(line) {
  const values = [];
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

function parseStateFromName(name) {
  const match = name.match(/,\s*([A-Z]{2})$/);
  return match?.[1] ?? "";
}

function formatCbsaName(name, namelsad) {
  return namelsad.replace(/\s+Metro Area$/, "").replace(/\s+Micro Area$/, "").trim() || name;
}

function estimatePopulation(aland) {
  return Math.max(5_000, Math.round(aland / 3_200));
}

function isMetropolitan(lsad, namelsad) {
  return lsad === "M1" || /Metropolitan Statistical Area/i.test(namelsad ?? "");
}

function isMicropolitan(lsad, namelsad) {
  return lsad === "M2" || /Micropolitan Statistical Area/i.test(namelsad ?? "");
}

function buildPopulationByCbsa(crosswalkRows) {
  const populationByCbsa = new Map();
  for (const row of crosswalkRows) {
    const code = row.cbsacode;
    if (!code) continue;
    populationByCbsa.set(code, (populationByCbsa.get(code) ?? 0) + 25_000);
  }
  return populationByCbsa;
}

const crosswalkText = readFileSync(resolve(dataDir, "cbsa-county-crosswalk-2023.csv"), "utf8");
const crosswalkLines = crosswalkText.trim().split(/\r?\n/);
const headers = parseCsvLine(crosswalkLines[0]);
const crosswalkRows = crosswalkLines.slice(1).map((line) => {
  const values = parseCsvLine(line);
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });
  return row;
});

const populationByCbsa = buildPopulationByCbsa(crosswalkRows);
const cbsaGeo = JSON.parse(readFileSync(resolve(dataDir, "cbsa-20m.json"), "utf8"));

const geographies = [];
const statisticalAreaFeatures = [];

for (const feature of cbsaGeo.features) {
  const { CBSAFP, NAME, NAMELSAD, LSAD, ALAND, CSAFP } = feature.properties;

  let kind = null;
  if (isMetropolitan(LSAD, NAMELSAD)) kind = "msa";
  else if (isMicropolitan(LSAD, NAMELSAD)) kind = "micropolitan";
  else continue;

  const id = `${kind}-${CBSAFP}`;
  const name = formatCbsaName(NAME, NAMELSAD);
  const state = parseStateFromName(NAME);
  const population = populationByCbsa.get(CBSAFP) ?? estimatePopulation(ALAND ?? 0);

  const record = {
    id,
    kind,
    code: CBSAFP,
    cbsaCode: CBSAFP,
    csaCode: CSAFP || "",
    name,
    state,
    population,
    status: "inactive",
  };

  geographies.push(record);
  statisticalAreaFeatures.push({
    type: "Feature",
    properties: {
      type: "statistical_area",
      ...record,
    },
    geometry: feature.geometry,
  });
}

geographies.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(resolve(dataDir, "geography-catalog.json"), JSON.stringify({ geographies }));

writeFileSync(
  resolve(dataDir, "statistical-areas.geojson"),
  JSON.stringify({
    type: "FeatureCollection",
    features: statisticalAreaFeatures,
  }),
);

writeFileSync(resolve(dataDir, "geography-index.json"), JSON.stringify({ countyAssignments: {} }));

const kindCounts = statisticalAreaFeatures.reduce((acc, feature) => {
  const kind = feature.properties.kind;
  acc[kind] = (acc[kind] || 0) + 1;
  return acc;
}, {});

console.log(`Statistical area polygons: ${statisticalAreaFeatures.length}`);
console.log("Kinds:", kindCounts);
console.log("Output: statistical-areas.geojson (official Census CBSA boundaries: MSA + Micropolitan only)");
