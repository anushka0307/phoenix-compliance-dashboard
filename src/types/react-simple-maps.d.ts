declare module "react-simple-maps" {
  import type { ComponentProps, ReactNode, SVGProps } from "react";

  export interface GeographyFeature {
    rsmKey: string;
    properties: Record<string, string>;
    geometry: unknown;
  }

  export type { GeographyFeature as GeographyFeatureType };

  export interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: Record<string, number>;
    width?: number;
    height?: number;
  }

  export function ComposableMap(props: ComposableMapProps): ReactNode;

  export interface GeographiesProps {
    geography: string | object;
    parseGeographies?: (features: GeoJSON.Feature[]) => GeoJSON.Feature[];
    children: (args: { geographies: GeographyFeature[] }) => ReactNode;
  }

  export function Geographies(props: GeographiesProps): ReactNode;

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeographyFeature;
    style?: {
      default?: SVGProps<SVGPathElement>["style"];
      hover?: SVGProps<SVGPathElement>["style"];
      pressed?: SVGProps<SVGPathElement>["style"];
    };
  }

  export function Geography(props: GeographyProps): ReactNode;

  export interface MarkerProps extends SVGProps<SVGSVGElement> {
    coordinates: [number, number];
  }

  export function Marker(props: MarkerProps): ReactNode;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    children?: ReactNode;
  }

  export function ZoomableGroup(props: ZoomableGroupProps): ReactNode;
}
