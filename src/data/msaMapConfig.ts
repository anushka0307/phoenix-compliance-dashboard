/** Official US Census CBSA cartographic boundary file (GENZ2023, 1:20M). */
export const CBSA_GEOJSON_URL = "/data/cbsa-20m.json";

/** Pre-built Statistical Area polygons from official Census CBSA + CSA boundaries. */
export const STATISTICAL_AREAS_GEOJSON_URL = "/data/statistical-areas.geojson";

/** Precomputed county → geography assignments. */
export const GEOGRAPHY_INDEX_URL = "/data/geography-index.json";

/** Catalog of MSAs, CSAs, and micropolitan areas. */
export const GEOGRAPHY_CATALOG_URL = "/data/geography-catalog.json";

/** US counties TopoJSON (1:10M) for MSA territory maps. */
export const COUNTIES_TOPOJSON_URL = "/data/counties-10m.json";

/** CBSA ↔ county crosswalk for territory county filtering. */
export const CBSA_COUNTY_CROSSWALK_URL = "/data/cbsa-county-crosswalk-2023.csv";

export const CBSA_SOURCE = {
  name: "U.S. Census Bureau Cartographic Boundary Files",
  vintage: "2023",
  scale: "1:20,000,000",
  layer: "Core Based Statistical Areas (CBSA)",
};

export const MAP_STYLES = {
  nonPortfolio: {
    fill: "#edf1f5",
    stroke: "#d8e0e8",
    strokeWidth: 0.2,
  },
  portfolio: {
    strokeWidth: 1.25,
    hoverStrokeWidth: 2,
  },
  /** Base layer: every statistical area visible with shared borders. */
  statisticalArea: {
    fill: "#cbd5e1",
    stroke: "#ffffff",
    strokeWidth: 0.65,
  },
  background: "#f8fafc",
} as const;
