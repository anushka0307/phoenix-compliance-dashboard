export type ClientHealthStatus = "healthy" | "attention" | "at_risk";

export type InsightSeverity = "high" | "medium" | "low";

export type BenchmarkStatus = "above" | "below" | "on_target";

export interface MsaCoverageSummary {
  coverageCounties: number;
  activeClients: number;
  population: number;
  marketPenetration: number;
}

export interface MsaClient {
  id: string;
  name: string;
  patients: number;
  revenue: number;
  retention: number;
  homeHealthAgencies: number;
  health: ClientHealthStatus;
  coordinates: [number, number];
}

export interface MsaWorkspaceInsight {
  id: string;
  message: string;
  severity: InsightSeverity;
}

export interface MsaBenchmarkComparison {
  id: string;
  label: string;
  value: string;
  networkAverage: string;
  status: BenchmarkStatus;
}

export interface MsaActivityItem {
  id: string;
  period: string;
  message: string;
}

export interface MsaOperatingFunctionKpi {
  opportunityScore: number;
  conversionRate: number;
  partnerRetention: number;
}

export type MapLayerId =
  | "counties"
  | "zipHeatmap"
  | "physicianDensity"
  | "hhaDensity"
  | "existingClients";

export interface MsaCountyRegion {
  id: string;
  name: string;
  coordinates: [number, number];
  clients: number;
  patients: number;
  physicianGroups: number;
  homeHealthAgencies: number;
  underserved: boolean;
  uncovered: boolean;
  highOpportunity: boolean;
}

export interface MsaHhaLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  patients: number;
}

export interface MsaMarketEstimates {
  population: number;
  estimatedPatients: number;
  estimatedPhysicianGroups: number;
  estimatedPhysicians: number;
  estimatedHhas: number;
  marketPenetration: number;
}

export interface MapPointCluster {
  id: string;
  coordinates: [number, number];
  count: number;
  type: "pg" | "hha" | "mixed";
}

export interface TerritoryProvider {
  id: string;
  name: string;
  type: "pg" | "hha";
  coordinates: [number, number];
  county: string;
  patients: number;
  status: string;
  client?: MsaClient;
}
