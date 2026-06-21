import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import shp from "shpjs";

const zipPath = resolve("public/data/cbsa-20m.zip");
const outputPath = resolve("public/data/cbsa-20m.json");

const zipBuffer = readFileSync(zipPath);
const geojson = await shp(zipBuffer);

writeFileSync(outputPath, JSON.stringify(geojson));

console.log(`Wrote ${outputPath} with ${geojson.features.length} CBSA features`);
