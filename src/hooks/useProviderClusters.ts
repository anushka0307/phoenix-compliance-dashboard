import { useMemo } from "react";
import Supercluster from "supercluster";
import type { Feature, Point } from "geojson";
import type { TerritoryProvider } from "@/types/msaWorkspace";
import { mapZoomToClusterZoom } from "@/utils/msaTerritoryMapUtils";

type ProviderFeature = Feature<Point, TerritoryProvider>;
type ProviderProperties = TerritoryProvider;

export function useProviderClusters(
  providers: TerritoryProvider[],
  bbox: [number, number, number, number],
  mapZoom: number,
  baseZoom: number,
) {
  const index = useMemo(() => {
    const clusterIndex = new Supercluster<ProviderProperties, ProviderProperties>({
      radius: 30,
      maxZoom: 10,
      minZoom: 0,
    });

    const features: ProviderFeature[] = providers.map((provider) => ({
      type: "Feature" as const,
      properties: provider,
      geometry: {
        type: "Point" as const,
        coordinates: provider.coordinates,
      },
    }));

    clusterIndex.load(features);
    return clusterIndex;
  }, [providers]);

  const clusterZoom = mapZoomToClusterZoom(mapZoom, baseZoom);

  const clusters = useMemo(
    () => index.getClusters(bbox, clusterZoom),
    [index, bbox, clusterZoom],
  );

  return { clusters, index, clusterZoom };
}
