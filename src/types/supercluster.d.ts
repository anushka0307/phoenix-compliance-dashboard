declare module "supercluster" {
  import type { BBox, GeoJSONFeature } from "geojson";

  export interface Options<P, C> {
    minZoom?: number;
    maxZoom?: number;
    minPoints?: number;
    radius?: number;
    extent?: number;
    nodeSize?: number;
    log?: boolean;
    generateId?: boolean;
    reduce?: (accumulated: C, props: P) => void;
    map?: (props: P) => C;
  }

  export default class Supercluster<P = unknown, C = unknown> {
    constructor(options?: Options<P, C>);
    load(features: GeoJSONFeature[]): Supercluster<P, C>;
    getClusters(bbox: BBox, zoom: number): GeoJSONFeature[];
    getChildren(clusterId: number): GeoJSONFeature[];
    getLeaves(clusterId: number, limit?: number, offset?: number): GeoJSONFeature[];
    getTile(z: number, x: number, y: number): unknown;
    getClusterExpansionZoom(clusterId: number): number;
  }
}
