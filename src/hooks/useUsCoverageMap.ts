import { useEffect, useMemo, useState } from "react";
import { CBSA_GEOJSON_URL } from "@/data/msaMapConfig";
import { usePortfolio } from "@/contexts/NetworkContext";
import type { GeographyRecord } from "@/types/geography";
import {
  buildGeographyLookups,
  loadGeographyCatalog,
  resolveCbsaGeography,
} from "@/utils/geographyCoverage";

export function useStatisticalAreasMap() {
  const { allMsas, dashboardMsas } = usePortfolio();
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geographies, setGeographies] = useState<GeographyRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(CBSA_GEOJSON_URL).then((response) => response.json()),
      loadGeographyCatalog(),
    ])
      .then(([censusGeojson, catalog]) => {
        if (cancelled) return;

        setGeoData(censusGeojson as GeoJSON.FeatureCollection);
        setGeographies(catalog);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const lookups = useMemo(
    () => buildGeographyLookups(geographies, allMsas, dashboardMsas),
    [geographies, allMsas, dashboardMsas],
  );

  const resolveByCbsa = useMemo(
    () => (cbsaCode: string, censusFeature?: GeoJSON.Feature) =>
      resolveCbsaGeography(
        cbsaCode,
        lookups.byCbsa,
        lookups.marketByGeographyId,
        censusFeature,
      ),
    [lookups],
  );

  return {
    geoData,
    geographies,
    loaded,
    ...lookups,
    resolveByCbsa,
  };
}

/** @deprecated Use useStatisticalAreasMap */
export const useUsCoverageMap = useStatisticalAreasMap;
