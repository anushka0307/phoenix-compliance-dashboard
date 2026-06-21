import type { MSA } from "@/types/msa";
import type {
  ClientHealthStatus,
  MapPointCluster,
  MsaActivityItem,
  MsaBenchmarkComparison,
  MsaClient,
  MsaCountyRegion,
  MsaCoverageSummary,
  MsaHhaLocation,
  MsaMarketEstimates,
  MsaOperatingFunctionKpi,
  MsaWorkspaceInsight,
} from "@/types/msaWorkspace";
import { calculateMsaMetrics } from "@/utils/calculateMsaMetrics";
import { getMarketAnalysisBundle } from "@/data/marketAnalysisData";
import { buildExecutiveKpis } from "@/utils/marketAnalysisHelpers";
import { getNetworkKpis } from "@/utils/networkAnalytics";
import { getPartnerRetention } from "@/utils/msaMetrics";
import { formatCurrency, formatPercent } from "@/utils/format";
import { getShortMarketName } from "@/utils/msaStatus";

const CLIENT_NAME_PREFIXES = [
  "North",
  "South",
  "East",
  "West",
  "Central",
  "Metro",
  "Regional",
  "Community",
];

const CLIENT_NAME_SUFFIXES = [
  "Physicians",
  "Medical Group",
  "Health Partners",
  "Care Network",
  "Primary Care",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function calculateCoverageCounties(population: number): number {
  return Math.max(1, Math.round(population / 250_000));
}

export function calculateMarketPenetration(patients: number, population: number): number {
  if (population <= 0) return 0;
  return Math.round((patients / population) * 1000) / 10;
}

export function getMsaCoverageSummary(msa: MSA): MsaCoverageSummary {
  return {
    coverageCounties: calculateCoverageCounties(msa.population),
    activeClients: msa.physicianGroups,
    population: msa.population,
    marketPenetration: calculateMarketPenetration(msa.patients, msa.population),
  };
}

function clientHealthFromRetention(retention: number): ClientHealthStatus {
  if (retention >= 96) return "healthy";
  if (retention >= 90) return "attention";
  return "at_risk";
}

export function clientMarkerRadius(patients: number, maxPatients: number): number {
  if (maxPatients <= 0) return 6;
  return 5 + (patients / maxPatients) * 12;
}

export function clientMarkerColor(health: ClientHealthStatus): string {
  if (health === "healthy") return "#22c55e";
  if (health === "attention") return "#f59e0b";
  return "#ef4444";
}

export function generateMsaClients(
  msa: MSA,
  center: [number, number],
): MsaClient[] {
  const count = Math.max(msa.physicianGroups, 0);
  if (count === 0) return [];

  const marketLabel = getShortMarketName(msa.name).split("-")[0]?.trim() ?? msa.state;
  const baseRetention = getPartnerRetention(msa.churnRate);
  const clients: MsaClient[] = [];

  for (let i = 0; i < count; i += 1) {
    const id = `${msa.id}-client-${i}`;
    const hash = hashString(id);
    const basePatients = Math.floor(msa.patients / count);
    const baseRevenue = Math.floor(msa.revenue / count);
    const patients = Math.max(1, basePatients + (i < msa.patients % count ? 1 : 0));
    const revenue = Math.max(0, baseRevenue + (i < msa.revenue % count ? 1 : 0));
    const retention = Math.round((baseRetention + ((hash % 20) - 10) / 10) * 10) / 10;
    const hhas = Math.max(1, Math.round((msa.homeHealthAgencies / count) * (0.8 + (hash % 5) / 10)));

    const angle = (i / count) * Math.PI * 2;
    const radius = 0.25 + (hash % 100) / 400;
    const golden = i * 2.399963;
    const jitter = 0.003 + (hash % 10) * 0.0004;
    const coordinates: [number, number] = [
      center[0] + Math.cos(angle) * radius + Math.cos(golden) * jitter,
      center[1] + Math.sin(angle) * radius * 0.7 + Math.sin(golden) * jitter * 0.7,
    ];

    const prefix = CLIENT_NAME_PREFIXES[hash % CLIENT_NAME_PREFIXES.length];
    const suffix = CLIENT_NAME_SUFFIXES[(hash >> 3) % CLIENT_NAME_SUFFIXES.length];

    clients.push({
      id,
      name: `${prefix} ${marketLabel} ${suffix}`,
      patients,
      revenue,
      retention,
      homeHealthAgencies: hhas,
      health: clientHealthFromRetention(retention),
      coordinates,
    });
  }

  return clients;
}

export function getMsaMarketEstimates(msa: MSA): MsaMarketEstimates {
  const derived = calculateMsaMetrics(msa.population);
  return {
    population: msa.population,
    estimatedPatients: derived.patients,
    estimatedPhysicianGroups: derived.physicianGroups,
    estimatedPhysicians: derived.physicians,
    estimatedHhas: derived.homeHealthAgencies,
    marketPenetration: calculateMarketPenetration(msa.patients, msa.population),
  };
}

const COUNTY_NAMES = [
  "Jefferson",
  "Adams",
  "Arapahoe",
  "Douglas",
  "Boulder",
  "Weld",
  "Larimer",
  "El Paso",
  "Denver",
  "Fulton",
  "Cobb",
  "Gwinnett",
  "DeKalb",
  "Wake",
  "Durham",
  "Orange",
  "Davidson",
  "Williamson",
  "Shelby",
  "Maricopa",
];

export function generateMsaCounties(msa: MSA, center: [number, number]): MsaCountyRegion[] {
  const count = calculateCoverageCounties(msa.population);
  const totalPgs = Math.max(msa.physicianGroups, 1);
  const totalHhas = Math.max(msa.homeHealthAgencies, 1);
  const totalPatients = Math.max(msa.patients, 1);
  const totalClients = Math.max(msa.physicianGroups, 0);

  return Array.from({ length: count }, (_, index) => {
    const id = `${msa.id}-county-${index}`;
    const hash = hashString(id);
    const angle = (index / count) * Math.PI * 2;
    const radius = 0.12 + (hash % 80) / 500;
    const share = 1 / count;
    const jitter = ((hash % 20) - 10) / 1000;

    return {
      id,
      name: COUNTY_NAMES[(hash + index) % COUNTY_NAMES.length],
      coordinates: [
        center[0] + Math.cos(angle) * radius + jitter,
        center[1] + Math.sin(angle) * radius * 0.75 + jitter,
      ] as [number, number],
      clients: Math.max(0, Math.round(totalClients * share)),
      patients: Math.max(0, Math.round(totalPatients * share)),
      physicianGroups: Math.max(0, Math.round(totalPgs * share)),
      homeHealthAgencies: Math.max(0, Math.round(totalHhas * share)),
      underserved: hash % 5 === 0,
      uncovered: hash % 7 === 0,
      highOpportunity: hash % 4 === 0 || msa.status === "opportunity",
    };
  });
}

export function generateMsaHhaLocations(
  msa: MSA,
  center: [number, number],
): MsaHhaLocation[] {
  const count = Math.max(msa.homeHealthAgencies, 0);
  if (count === 0) return [];

  const marketLabel = getShortMarketName(msa.name).split("-")[0]?.trim() ?? msa.state;
  const basePatients = Math.max(1, Math.floor(msa.patients / Math.max(msa.physicianGroups, 1)));

  return Array.from({ length: count }, (_, index) => {
    const id = `${msa.id}-hha-${index}`;
    const hash = hashString(id);
    const angle = (index / count) * Math.PI * 2 + 0.4;
    const radius = 0.18 + (hash % 60) / 350;
    const golden = index * 2.399963;
    const jitter = 0.0025 + (hash % 8) * 0.00035;

    return {
      id,
      name: `${marketLabel} Home Health ${index + 1}`,
      coordinates: [
        center[0] + Math.cos(angle) * radius + Math.cos(golden) * jitter,
        center[1] + Math.sin(angle) * radius * 0.65 + Math.sin(golden) * jitter * 0.65,
      ] as [number, number],
      patients: Math.max(10, Math.round(basePatients * (0.4 + (hash % 8) / 10))),
    };
  });
}

interface ClusterInput {
  id: string;
  coordinates: [number, number];
  type: "pg" | "hha";
}

export function clusterMapPoints(
  points: ClusterInput[],
  zoom: number,
  baseZoom: number,
): Array<MapPointCluster | ClusterInput> {
  if (points.length <= 8 || zoom >= baseZoom + 1.2) {
    return points;
  }

  const cellSize = 0.22 / Math.max(zoom / baseZoom, 0.5);
  const grid = new Map<string, ClusterInput[]>();

  for (const point of points) {
    const key = `${Math.floor(point.coordinates[0] / cellSize)}:${Math.floor(point.coordinates[1] / cellSize)}`;
    const bucket = grid.get(key) ?? [];
    bucket.push(point);
    grid.set(key, bucket);
  }

  const clusters: Array<MapPointCluster | ClusterInput> = [];

  grid.forEach((bucket, key) => {
    if (bucket.length === 1) {
      clusters.push(bucket[0]);
      return;
    }

    const avgLng = bucket.reduce((sum, p) => sum + p.coordinates[0], 0) / bucket.length;
    const avgLat = bucket.reduce((sum, p) => sum + p.coordinates[1], 0) / bucket.length;
    const types = new Set(bucket.map((p) => p.type));
    clusters.push({
      id: `cluster-${key}`,
      coordinates: [avgLng, avgLat],
      count: bucket.length,
      type: types.size > 1 ? "mixed" : bucket[0].type,
    });
  });

  return clusters;
}

export function getMsaOpportunities(msa: MSA): MsaWorkspaceInsight[] {
  const insights: MsaWorkspaceInsight[] = [];
  const { profile } = getMarketAnalysisBundle(msa.id);
  const penetration = calculateMarketPenetration(msa.patients, msa.population);
  const uncoveredShare = profile.uncoveredZipCodes;

  if (uncoveredShare > 0) {
    insights.push({
      id: "underpenetrated-counties",
      message: `${uncoveredShare > 10 ? "Northwest" : "Peripheral"} counties remain underpenetrated.`,
      severity: "medium",
    });
  }

  const unonboardedPg = Math.max(
    0,
    profile.totalPhysicianGroups - msa.physicianGroups,
  );
  if (unonboardedPg > 0) {
    const largeGroups = Math.max(1, Math.round(unonboardedPg * 0.15));
    insights.push({
      id: "unonboarded-pg",
      message: `${largeGroups} large physician group${largeGroups === 1 ? "" : "s"} ${largeGroups === 1 ? "is" : "are"} not onboarded.`,
      severity: unonboardedPg > 50 ? "high" : "medium",
    });
  }

  if (profile.populationGrowthRate >= 1.5) {
    insights.push({
      id: "hha-demand",
      message: `Home health demand increased ${formatPercent(profile.populationGrowthRate * 4)} YoY.`,
      severity: "low",
    });
  }

  if (penetration < 2) {
    insights.push({
      id: "low-penetration",
      message: `Market penetration at ${formatPercent(penetration)} leaves expansion headroom.`,
      severity: "medium",
    });
  }

  if (msa.status === "opportunity") {
    insights.push({
      id: "expansion-window",
      message: "Expansion window favorable based on network growth benchmarks.",
      severity: "low",
    });
  }

  return insights.slice(0, 5);
}

export function getMsaRisks(msa: MSA): MsaWorkspaceInsight[] {
  const risks: MsaWorkspaceInsight[] = [];
  const clients = msa.physicianGroups;

  if (clients >= 2 && msa.revenue > 0) {
    const topTwoShare = Math.min(65, 40 + msa.healthScore / 3);
    risks.push({
      id: "revenue-concentration",
      message: `Revenue concentrated among top two clients (~${Math.round(topTwoShare)}%).`,
      severity: topTwoShare > 55 ? "high" : "medium",
    });
  }

  if (msa.onboardingDays > 44) {
    risks.push({
      id: "onboarding-delay",
      message: `Onboarding exceeds target by ${msa.onboardingDays - 44} days.`,
      severity: "medium",
    });
  }

  if (msa.churnRate > 3) {
    risks.push({
      id: "referral-slowdown",
      message: "Referral growth slowed this quarter.",
      severity: msa.churnRate > 5 ? "high" : "medium",
    });
  }

  if (msa.status === "attention-required" || msa.healthScore < 70) {
    risks.push({
      id: "market-health",
      message: "Market strength below network operating threshold.",
      severity: "high",
    });
  }

  if (msa.conversionRate < 20) {
    risks.push({
      id: "conversion-risk",
      message: `Qualified PG conversion trails network norms at ${formatPercent(msa.conversionRate)}.`,
      severity: "medium",
    });
  }

  return risks.slice(0, 5);
}

function benchmarkStatus(
  value: number,
  network: number,
  higherIsBetter = true,
): MsaBenchmarkComparison["status"] {
  const delta = value - network;
  const threshold = network * 0.02;
  if (Math.abs(delta) <= threshold) return "on_target";
  if (higherIsBetter) return delta > 0 ? "above" : "below";
  return delta < 0 ? "above" : "below";
}

export function getMsaBenchmarks(msa: MSA, networkMsas: MSA[]): MsaBenchmarkComparison[] {
  const network = getNetworkKpis(networkMsas);
  const retention = getPartnerRetention(msa.churnRate);
  const revenuePerPatient = msa.patients > 0 ? msa.revenue / msa.patients : 0;
  const networkRpp =
    network.patients > 0
      ? networkMsas.reduce((s, m) => s + m.revenue, 0) / network.patients
      : 0;

  return [
    {
      id: "retention",
      label: "Retention",
      value: formatPercent(retention),
      networkAverage: formatPercent(network.avgRetention),
      status: benchmarkStatus(retention, network.avgRetention),
    },
    {
      id: "conversion",
      label: "Conversion Rate",
      value: formatPercent(msa.conversionRate),
      networkAverage: formatPercent(network.pgaConversionRate),
      status: benchmarkStatus(msa.conversionRate, network.pgaConversionRate),
    },
    {
      id: "rpp",
      label: "Revenue per Patient",
      value: formatCurrency(revenuePerPatient),
      networkAverage: formatCurrency(networkRpp),
      status: benchmarkStatus(revenuePerPatient, networkRpp),
    },
    {
      id: "strength",
      label: "Market Strength",
      value: String(msa.healthScore),
      networkAverage: String(network.avgMarketStrength),
      status: benchmarkStatus(msa.healthScore, network.avgMarketStrength),
    },
  ];
}

export function getMsaOperatingKpis(msa: MSA, networkMsas: MSA[]): MsaOperatingFunctionKpi {
  const executive = buildExecutiveKpis(msa, networkMsas);
  return {
    opportunityScore: Math.round(executive.marketOpportunityScore),
    conversionRate: msa.conversionRate,
    partnerRetention: getPartnerRetention(msa.churnRate),
  };
}

export function getMsaRecentActivity(msa: MSA): MsaActivityItem[] {
  const items: MsaActivityItem[] = [];

  if (msa.homeHealthAgencies > 0) {
    const addedHhas = Math.max(1, Math.round(msa.homeHealthAgencies * 0.08));
    items.push({
      id: "hha-added",
      period: "Yesterday",
      message: `Added ${addedHhas} new HHA${addedHhas === 1 ? "" : "s"}`,
    });
  }

  if (msa.physicianGroups > 0) {
    items.push({
      id: "pg-onboarded",
      period: "Yesterday",
      message: "Onboarded 1 physician group",
    });
  }

  const retention = getPartnerRetention(msa.churnRate);
  if (retention > 90) {
    items.push({
      id: "retention-improved",
      period: "Last Week",
      message: `Retention improved by ${formatPercent(Math.max(0.5, (100 - msa.churnRate) * 0.012))}`,
    });
  }

  if (msa.revenue > 0) {
    items.push({
      id: "revenue-target",
      period: "Last Week",
      message: "Revenue target exceeded",
    });
  }

  if (msa.onboardingDays > 0) {
    items.push({
      id: "onboarding-progress",
      period: "Last Week",
      message: `Onboarding pipeline at ${msa.onboardingDays} days average`,
    });
  }

  return items.slice(0, 5);
}

export function getFeatureBboxCenter(geometry: {
  type: string;
  coordinates: unknown;
}): [number, number] {
  const points: [number, number][] = [];

  const walk = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      points.push([coords[0], coords[1]]);
      return;
    }
    coords.forEach(walk);
  };

  walk(geometry.coordinates);
  if (points.length === 0) return [-84.5, 33.7];

  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

export function estimateMapZoom(population: number): number {
  if (population >= 6_000_000) return 2.8;
  if (population >= 3_000_000) return 3.5;
  if (population >= 1_500_000) return 4.2;
  return 5;
}
