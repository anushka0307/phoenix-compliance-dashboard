import type { MarketAnalysisDataBundle } from "@/data/marketAnalysisData";
import type { MsaBase } from "@/types/msa";
import { hashSeed } from "@/utils/marketCalculations";
import { resolveMsaDemoProfile } from "@/utils/msaDemoProfiles";

const COUNTY_PREFIXES = [
  "North",
  "South",
  "East",
  "West",
  "Central",
  "Metro",
  "Riverside",
  "Highland",
  "Lakeview",
  "Pine",
];

const COMPETITOR_NAMES = [
  "Amedisys",
  "Enhabit",
  "LHC Group",
  "AccentCare",
  "Elara Caring",
  "Brookdale",
  "Gentiva",
];

export function generateMarketAnalysisBundle(msa: Pick<MsaBase, "id" | "population" | "state" | "name">): MarketAnalysisDataBundle {
  const seed = hashSeed(msa.id);
  const profile = resolveMsaDemoProfile({
    id: msa.id,
    cbsaCode: msa.id,
    name: msa.name,
    state: msa.state,
    status: "growing",
    population: msa.population,
    revenue: 0,
    onboardingDays: 0,
    conversionRate: 0,
    churnRate: 0,
    healthScore: 0,
  });
  const population = Math.max(msa.population, 100_000);

  const population65Plus = Math.round(population * (0.16 + (seed % 5) / 100));
  const medicarePopulation = Math.round(population65Plus * (0.78 + (seed % 8) / 100));
  const totalAddressablePatients = Math.round(
    medicarePopulation * (0.28 + (profile.referralCoveragePct ?? 40) / 200),
  );
  const totalPhysicianGroups = Math.max(2, Math.round(totalAddressablePatients / 420) + (seed % 12));
  const totalHomeHealthAgencies = Math.max(3, Math.round(population / 95_000) + (seed % 8));
  const uncoveredZipCodes = 8 + (seed % 18);
  const competitorCount = 6 + (seed % 9);
  const concentrationIndex = Math.round((0.28 + (seed % 20) / 100) * 100) / 100;
  const largestShare = 14 + (seed % 14);
  const competitiveIntensity = Math.round((4.5 + (seed % 35) / 10) * 10) / 10;
  const annualValue = 360 + (seed % 50);
  const income = 58_000 + (seed % 28) * 1000;

  const growthTrend =
    profile.revenueGrowthYoy > 4 ? "up" : profile.revenueGrowthYoy < 0 ? "down" : "neutral";

  const competitors = COMPETITOR_NAMES.slice(0, 4 + (seed % 3)).map((name, index) => ({
    name,
    estimatedShare: Math.max(5, largestShare - index * (3 + (seed % 3))),
    strength: (index < 2 ? "High" : index < 4 ? "Medium" : "Low") as "High" | "Medium" | "Low",
  }));

  const countyLabel = COUNTY_PREFIXES[seed % COUNTY_PREFIXES.length];
  const opportunities = [
    {
      id: `${msa.id}-opp-1`,
      name: `${countyLabel} ${msa.state} PG Expansion`,
      baseScore: Math.round(profile.opportunityScoreTarget ?? 60),
      estimatedRevenueImpact: Math.round(totalAddressablePatients * annualValue * 0.12),
      effortLevel: (seed % 3 === 0 ? "Low" : seed % 3 === 1 ? "Medium" : "High") as "Low" | "Medium" | "High",
    },
    {
      id: `${msa.id}-opp-2`,
      name: `${msa.name.split("-")[0] ?? msa.state} Hospice Line`,
      baseScore: 55 + (seed % 25),
      estimatedRevenueImpact: Math.round(totalAddressablePatients * annualValue * 0.08),
      effortLevel: "Medium" as const,
    },
    {
      id: `${msa.id}-opp-3`,
      name: `Underserved ZIP Coverage (${uncoveredZipCodes} gaps)`,
      baseScore: 62 + (seed % 20),
      estimatedRevenueImpact: Math.round(totalAddressablePatients * annualValue * 0.05),
      effortLevel: "Low" as const,
    },
  ];

  return {
    profile: {
      totalPopulation: population,
      population65Plus,
      medicarePopulation,
      populationGrowthRate: Math.round((profile.patientGrowthYoy ?? 2) * 10) / 10,
      medianHouseholdIncome: income,
      chronicDiseasePrevalence: Math.round((22 + (seed % 12) + (profile.tier === "attention" ? 4 : 0)) * 10) / 10,
      totalPhysicianGroups,
      totalHomeHealthAgencies,
      totalAddressablePatients,
      uncoveredZipCodes,
      competitorCount,
      marketConcentrationIndex: concentrationIndex,
      largestCompetitorShare: largestShare,
      competitiveIntensityScore: competitiveIntensity,
      annualValuePerPatient: annualValue,
      populationGrowthTrend: growthTrend,
      medicareGrowthTrend: growthTrend,
      incomeTrend: profile.tier === "growing" ? "up" : profile.tier === "attention" ? "down" : "neutral",
      chronicDiseaseTrend: profile.tier === "attention" ? "up" : "neutral",
    },
    competitors,
    opportunities,
  };
}
