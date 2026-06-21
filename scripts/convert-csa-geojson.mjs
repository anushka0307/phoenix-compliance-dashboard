import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import shp from "shpjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../public/data");
const zipPath = resolve(dataDir, "csa-20m.zip");
const outputPath = resolve(dataDir, "csa-20m.json");

const zipBuffer = readFileSync(zipPath);
const geojson = await shp(zipBuffer);

writeFileSync(outputPath, JSON.stringify(geojson));

console.log(`Wrote ${outputPath} with ${geojson.features.length} CSA features`);
