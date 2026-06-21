import { INITIAL_MSA_BASE } from "@/data/mockMsas";
import type {
  CompetitorRecord,
  MarketAnalysisProfile,
  OpportunitySeed,
} from "@/types/marketAnalysis";
import { generateMarketAnalysisBundle } from "@/utils/generatedMarketAnalysisData";

export interface MarketAnalysisDataBundle {
  profile: MarketAnalysisProfile;
  competitors: CompetitorRecord[];
  opportunities: OpportunitySeed[];
}

const DEFAULT_COMPETITORS: CompetitorRecord[] = [
  { name: "Amedisys", estimatedShare: 22, strength: "High" },
  { name: "Enhabit", estimatedShare: 18, strength: "High" },
  { name: "LHC Group", estimatedShare: 14, strength: "Medium" },
  { name: "AccentCare", estimatedShare: 11, strength: "Medium" },
  { name: "Elara Caring", estimatedShare: 8, strength: "Low" },
];

const DEFAULT_OPPORTUNITIES: OpportunitySeed[] = [
  {
    id: "north-county-pg",
    name: "North County PG Expansion",
    baseScore: 82,
    estimatedRevenueImpact: 1_400_000,
    effortLevel: "Medium",
  },
  {
    id: "hospice-line",
    name: "Hospice Service Line",
    baseScore: 71,
    estimatedRevenueImpact: 920_000,
    effortLevel: "High",
  },
  {
    id: "underserved-zip",
    name: "Underserved ZIP Coverage",
    baseScore: 88,
    estimatedRevenueImpact: 680_000,
    effortLevel: "Low",
  },
];

export const MARKET_ANALYSIS_DATA: Record<string, MarketAnalysisDataBundle> = {
  "atlanta-ga": {
    profile: {
      totalPopulation: 6_104_000,
      population65Plus: 812_000,
      medicarePopulation: 648_000,
      populationGrowthRate: 1.8,
      medianHouseholdIncome: 72_400,
      chronicDiseasePrevalence: 28.4,
      totalPhysicianGroups: 668,
      totalHomeHealthAgencies: 52,
      totalAddressablePatients: 295_000,
      uncoveredZipCodes: 14,
      competitorCount: 12,
      marketConcentrationIndex: 0.42,
      largestCompetitorShare: 22,
      competitiveIntensityScore: 6.8,
      annualValuePerPatient: 390,
      populationGrowthTrend: "up",
      medicareGrowthTrend: "up",
      incomeTrend: "up",
      chronicDiseaseTrend: "up",
    },
    competitors: DEFAULT_COMPETITORS,
    opportunities: DEFAULT_OPPORTUNITIES,
  },
  "dallas-tx": {
    profile: {
      totalPopulation: 7_637_000,
      population65Plus: 892_000,
      medicarePopulation: 714_000,
      populationGrowthRate: 2.4,
      medianHouseholdIncome: 69_800,
      chronicDiseasePrevalence: 27.1,
      totalPhysicianGroups: 742,
      totalHomeHealthAgencies: 61,
      totalAddressablePatients: 328_000,
      uncoveredZipCodes: 18,
      competitorCount: 14,
      marketConcentrationIndex: 0.38,
      largestCompetitorShare: 20,
      competitiveIntensityScore: 7.2,
      annualValuePerPatient: 368,
      populationGrowthTrend: "up",
      medicareGrowthTrend: "up",
      incomeTrend: "neutral",
      chronicDiseaseTrend: "neutral",
    },
    competitors: [
      { name: "Enhabit", estimatedShare: 24, strength: "High" },
      { name: "Amedisys", estimatedShare: 19, strength: "High" },
      { name: "LHC Group", estimatedShare: 15, strength: "Medium" },
      { name: "Brookdale", estimatedShare: 10, strength: "Medium" },
      { name: "AccentCare", estimatedShare: 7, strength: "Low" },
    ],
    opportunities: [
      {
        id: "north-county-pg",
        name: "North County PG Expansion",
        baseScore: 86,
        estimatedRevenueImpact: 1_850_000,
        effortLevel: "Medium",
      },
      {
        id: "hospice-line",
        name: "Hospice Service Line",
        baseScore: 74,
        estimatedRevenueImpact: 1_100_000,
        effortLevel: "High",
      },
      {
        id: "underserved-zip",
        name: "Underserved ZIP Coverage",
        baseScore: 91,
        estimatedRevenueImpact: 740_000,
        effortLevel: "Low",
      },
    ],
  },
  "phoenix-az": {
    profile: {
      totalPopulation: 4_948_000,
      population65Plus: 724_000,
      medicarePopulation: 579_000,
      populationGrowthRate: 2.9,
      medianHouseholdIncome: 67_200,
      chronicDiseasePrevalence: 26.8,
      totalPhysicianGroups: 412,
      totalHomeHealthAgencies: 38,
      totalAddressablePatients: 242_000,
      uncoveredZipCodes: 22,
      competitorCount: 9,
      marketConcentrationIndex: 0.35,
      largestCompetitorShare: 18,
      competitiveIntensityScore: 5.4,
      annualValuePerPatient: 375,
      populationGrowthTrend: "up",
      medicareGrowthTrend: "up",
      incomeTrend: "up",
      chronicDiseaseTrend: "neutral",
    },
    competitors: DEFAULT_COMPETITORS.slice(0, 4),
    opportunities: DEFAULT_OPPORTUNITIES,
  },
  "miami-fl": {
    profile: {
      totalPopulation: 6_138_000,
      population65Plus: 1_024_000,
      medicarePopulation: 819_000,
      populationGrowthRate: 1.2,
      medianHouseholdIncome: 61_500,
      chronicDiseasePrevalence: 31.6,
      totalPhysicianGroups: 588,
      totalHomeHealthAgencies: 44,
      totalAddressablePatients: 318_000,
      uncoveredZipCodes: 26,
      competitorCount: 15,
      marketConcentrationIndex: 0.48,
      largestCompetitorShare: 26,
      competitiveIntensityScore: 8.1,
      annualValuePerPatient: 362,
      populationGrowthTrend: "neutral",
      medicareGrowthTrend: "up",
      incomeTrend: "neutral",
      chronicDiseaseTrend: "up",
    },
    competitors: [
      { name: "Amedisys", estimatedShare: 26, strength: "High" },
      { name: "VITAS", estimatedShare: 17, strength: "High" },
      { name: "Enhabit", estimatedShare: 14, strength: "Medium" },
      { name: "LHC Group", estimatedShare: 12, strength: "Medium" },
      { name: "Gentiva", estimatedShare: 9, strength: "Low" },
    ],
    opportunities: DEFAULT_OPPORTUNITIES,
  },
  "denver-co": {
    profile: {
      totalPopulation: 2_963_000,
      population65Plus: 398_000,
      medicarePopulation: 318_000,
      populationGrowthRate: 1.6,
      medianHouseholdIncome: 82_100,
      chronicDiseasePrevalence: 24.2,
      totalPhysicianGroups: 384,
      totalHomeHealthAgencies: 34,
      totalAddressablePatients: 168_000,
      uncoveredZipCodes: 11,
      competitorCount: 8,
      marketConcentrationIndex: 0.36,
      largestCompetitorShare: 19,
      competitiveIntensityScore: 5.9,
      annualValuePerPatient: 382,
      populationGrowthTrend: "up",
      medicareGrowthTrend: "up",
      incomeTrend: "up",
      chronicDiseaseTrend: "down",
    },
    competitors: DEFAULT_COMPETITORS.slice(0, 4),
    opportunities: DEFAULT_OPPORTUNITIES,
  },
  "nashville-tn": {
    profile: {
      totalPopulation: 2_012_000,
      population65Plus: 278_000,
      medicarePopulation: 222_000,
      populationGrowthRate: 2.1,
      medianHouseholdIncome: 71_300,
      chronicDiseasePrevalence: 27.9,
      totalPhysicianGroups: 248,
      totalHomeHealthAgencies: 22,
      totalAddressablePatients: 112_000,
      uncoveredZipCodes: 16,
      competitorCount: 7,
      marketConcentrationIndex: 0.33,
      largestCompetitorShare: 17,
      competitiveIntensityScore: 4.8,
      annualValuePerPatient: 356,
      populationGrowthTrend: "up",
      medicareGrowthTrend: "up",
      incomeTrend: "up",
      chronicDiseaseTrend: "neutral",
    },
    competitors: DEFAULT_COMPETITORS.slice(0, 3),
    opportunities: DEFAULT_OPPORTUNITIES,
  },
  "charlotte-nc": {
    profile: {
      totalPopulation: 2_684_000,
      population65Plus: 356_000,
      medicarePopulation: 285_000,
      populationGrowthRate: 2.3,
      medianHouseholdIncome: 70_600,
      chronicDiseasePrevalence: 26.1,
      totalPhysicianGroups: 312,
      totalHomeHealthAgencies: 28,
      totalAddressablePatients: 148_000,
      uncoveredZipCodes: 19,
      competitorCount: 9,
      marketConcentrationIndex: 0.37,
      largestCompetitorShare: 21,
      competitiveIntensityScore: 5.6,
      annualValuePerPatient: 370,
      populationGrowthTrend: "up",
      medicareGrowthTrend: "up",
      incomeTrend: "up",
      chronicDiseaseTrend: "neutral",
    },
    competitors: DEFAULT_COMPETITORS.slice(0, 4),
    opportunities: DEFAULT_OPPORTUNITIES,
  },
};

export function hasMarketAnalysisData(msaId: string): boolean {
  return msaId in MARKET_ANALYSIS_DATA;
}

export function getMarketAnalysisBundle(msaId: string): MarketAnalysisDataBundle {
  if (MARKET_ANALYSIS_DATA[msaId]) {
    return MARKET_ANALYSIS_DATA[msaId];
  }
  const msa = INITIAL_MSA_BASE.find((entry) => entry.id === msaId);
  if (msa) {
    return generateMarketAnalysisBundle(msa);
  }
  return generateMarketAnalysisBundle({
    id: msaId,
    name: msaId,
    state: "US",
    population: 500_000,
  });
}
