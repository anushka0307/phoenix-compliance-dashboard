import { getMarketAnalysisBundle } from "@/data/marketAnalysisData";
import type { MSA } from "@/types/msa";
import type {
  BusinessAnalytics,
  CompetitiveMetrics,
  CoverageIntelligence,
  CoverageMetrics,
  EnhancedCompetitor,
  ExecutiveSummary,
  MarketAnalysisExecutiveKpis,
  MarketAnalysisWorkspace,
  MarketFundamentalsMetrics,
  MarketRecommendation,
  OperationalAlert,
  OpportunityQuadrant,
  PhysicianNetworkIntelligence,
  PgAcquisitionFocus,
  PgAcquisitionTarget,
  PriorityLevel,
  ProviderLandscapeMetrics,
  ReferralNetworkIntelligence,
  ScenarioBaseline,
  ScoredOpportunity,
  TrendMetric,
} from "@/types/marketAnalysis";
import { resolveMsaDemoProfile } from "@/utils/msaDemoProfiles";
import { isMsaActivated } from "@/utils/msaActivation";
import {
  buildMarketCoverageMetrics,
  buildMarketSizing,
  buildSlaMetrics,
  clampPercent,
  computeCappedPatientReach,
  computeOpportunityRevenue,
  hashSeed,
} from "@/utils/marketCalculations";
import { formatCurrency, formatPercent } from "@/utils/format";

export {
  computeMarketPenetration,
  computeOpportunityScore,
  computeHhaDensity,
  computeTam,
  computePgPenetration,
  computeNetworkRank,
} from "@/utils/marketAnalysisCore";

import {
  computeHhaDensity,
  computeNetworkRank,
  computeOpportunityScore,
  computeTam,
} from "@/utils/marketAnalysisCore";

function scoreToPriority(score: number): PriorityLevel {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

function effortToScore(level: "Low" | "Medium" | "High"): number {
  if (level === "Low") return 28;
  if (level === "Medium") return 58;
  return 82;
}

function classifyQuadrant(effortScore: number, revenueScore: number): OpportunityQuadrant {
  const highRevenue = revenueScore >= 50;
  const highEffort = effortScore >= 50;
  if (!highEffort && highRevenue) return "quick-wins";
  if (highEffort && highRevenue) return "strategic-bets";
  if (highEffort && !highRevenue) return "long-term-plays";
  return "low-priority";
}

const COUNTY_NAMES = ["North", "Central", "East", "West", "South"];
const SPECIALTIES = ["Primary Care", "Cardiology", "Geriatrics", "Internal Medicine", "Family Medicine"];

function getMarketSizingForMsa(msa: MSA) {
  const bundle = getMarketAnalysisBundle(msa.id);
  const population = bundle.profile.totalPopulation || msa.population;
  return buildMarketSizing(
    population,
    bundle.profile.medicarePopulation,
    bundle.profile.chronicDiseasePrevalence,
  );
}

function getCoverageContext(msa: MSA) {
  const bundle = getMarketAnalysisBundle(msa.id);
  const sizing = getMarketSizingForMsa(msa);
  const totalZipCodes = Math.max(bundle.profile.uncoveredZipCodes + 12, 18);
  const hash = hashSeed(msa.id);
  const referralPathways = {
    active: Math.min(msa.physicianGroups * 3 + msa.homeHealthAgencies * 2, 35 + (hash % 15)),
    total: 48 + (hash % 22),
  };
  const metrics = buildMarketCoverageMetrics(
    msa,
    sizing,
    totalZipCodes,
    bundle.profile.uncoveredZipCodes,
    referralPathways,
  );
  const demoProfile = resolveMsaDemoProfile(msa);
  if (isMsaActivated(msa) && demoProfile.referralCoveragePct !== undefined) {
    metrics.referralCoverage = demoProfile.referralCoveragePct;
  }
  return { bundle, sizing, totalZipCodes, referralPathways, metrics };
}

function buildCountyRows(
  msa: MSA,
  profile: ReturnType<typeof getMarketAnalysisBundle>["profile"],
  sizing: ReturnType<typeof buildMarketSizing>,
): CoverageIntelligence["countyGaps"] {
  const perCountyAddressable = Math.round(sizing.addressablePatients / COUNTY_NAMES.length);
  const pgsPerCounty = Math.max(1, Math.round(sizing.totalPhysicianGroups / COUNTY_NAMES.length));
  const activePgsPerCounty = Math.max(0, Math.round(msa.physicianGroups / COUNTY_NAMES.length));

  const coverageGapWeight = 0.45;
  const growthWeight = 0.3;
  const priorityWeight = 0.25;

  const rawRows = COUNTY_NAMES.map((name, index) => {
    const countyHash = hashSeed(`${msa.id}-${name}`);
    const addressable = perCountyAddressable + (countyHash % 400);
    const countyActivePgs = Math.min(pgsPerCounty, activePgsPerCounty + (index % 2));
    const pgPenetration = pgsPerCounty > 0 ? clampPercent((countyActivePgs / pgsPerCounty) * 100) : 0;
    const uncoveredZips = index < 2 ? Math.ceil(profile.uncoveredZipCodes / 2) : countyHash % 4;

    const countyCoveredPatients = Math.min(
      addressable,
      Math.round(
        countyActivePgs * (42 + (countyHash % 28)) +
          (countyHash % 180) +
          index * 95,
      ),
    );
    const referralCoverage =
      addressable > 0
        ? clampPercent((countyCoveredPatients / addressable) * 100)
        : clampPercent(10 + (countyHash % 18) + index * 3);

    const active = Math.min(addressable, countyCoveredPatients);
    const patientReach = computeCappedPatientReach(active, addressable, pgPenetration);
    const uncoveredPatients = Math.max(0, addressable - countyCoveredPatients);
    const referralVolume = countyActivePgs * (28 + (countyHash % 35));
    const marketPotential = clampPercent(55 + (countyHash % 35) + index * 4);

    const rawOpportunityScore =
      coverageGapWeight * (uncoveredPatients / Math.max(addressable, 1)) * 100 +
      growthWeight * Math.min(100, referralVolume / 4) +
      priorityWeight * marketPotential;

    const opportunityValue = Math.round(uncoveredPatients * profile.annualValuePerPatient);

    return {
      county: `${name} County`,
      addressablePatients: addressable,
      activePatients: active,
      pgPenetration,
      patientReach,
      referralCoverage,
      opportunityScore: rawOpportunityScore,
      uncoveredZips,
      opportunityValue,
    };
  });

  const maxRawScore = Math.max(...rawRows.map((row) => row.opportunityScore), 1);
  const minRawScore = Math.min(...rawRows.map((row) => row.opportunityScore));

  return rawRows
    .map((row) => ({
      ...row,
      opportunityScore:
        maxRawScore === minRawScore
          ? clampPercent(40 + hashSeed(`${row.county}-score`) % 45)
          : Math.round(
              20 + ((row.opportunityScore - minRawScore) / (maxRawScore - minRawScore)) * 65,
            ),
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function generateMonthlySeries(
  seed: string,
  base: number,
  growth: number,
  variance = 0.06,
): number[] {
  const hash = hashSeed(seed);
  const months: number[] = [];
  let value = base * (1 - growth * 0.5);
  for (let i = 0; i < 12; i += 1) {
    const wave = Math.sin((i + (hash % 7)) * 0.55) * variance;
    value *= 1 + growth / 12 + wave * 0.02;
    months.push(Math.max(0, Math.round(value)));
  }
  months[11] = base;
  return months;
}

function enhanceCompetitor(
  competitor: { name: string; estimatedShare: number; strength: "High" | "Medium" | "Low" },
  index: number,
  sizing: ReturnType<typeof buildMarketSizing>,
  msaId: string,
): EnhancedCompetitor {
  const hash = hashSeed(`${msaId}-${competitor.name}`);
  const shareFactor = competitor.estimatedShare / 100;
  return {
    ...competitor,
    growthRate: Math.round((3 + (hash % 12) + index) * 10) / 10,
    estimatedPgCount: Math.max(1, Math.round(sizing.totalPhysicianGroups * shareFactor * 0.4)),
    estimatedHhaCount: Math.max(1, Math.round(sizing.totalHomeHealthAgencies * shareFactor * 0.35)),
    countiesServed: 2 + (hash % 8) + index,
    serviceLineStrengths: [
      competitor.strength === "High" ? "Home health" : "Skilled nursing",
      hash % 2 === 0 ? "Hospice" : "Personal care",
      hash % 3 === 0 ? "Rehab therapy" : "Chronic care",
    ].slice(0, 2 + (hash % 2)),
    geographicOverlap: clampPercent(shareFactor * 65 + (hash % 20)),
  };
}

function buildZipHeatmap(
  msa: MSA,
  uncoveredZipCodes: number,
  totalZipCodes: number,
): CoverageIntelligence["zipHeatmap"] {
  const cells: CoverageIntelligence["zipHeatmap"] = [];
  const coveredCount = totalZipCodes - uncoveredZipCodes;

  for (let i = 0; i < totalZipCodes; i += 1) {
    const cellHash = hashSeed(`${msa.id}-zip-${i}`);
    const county = COUNTY_NAMES[i % COUNTY_NAMES.length];
    const countyRow = COUNTY_NAMES.indexOf(county);
    const isCovered = i < coveredCount;
    const coverageGap = isCovered
      ? clampPercent((cellHash % 18) + 4)
      : clampPercent(55 + (cellHash % 40));
    const pgPen = clampPercent(12 + (cellHash % 35));
    const patientReach = clampPercent(8 + (cellHash % 30));
    cells.push({
      zip: `${String(30000 + (cellHash % 70000)).slice(0, 5)}`,
      county: `${county} County`,
      coverageGap,
      isCovered,
      pgPenetration: pgPen,
      patientReach,
      opportunityValue: Math.round((coverageGap / 100) * 125_000 + countyRow * 15_000),
      competitorDensity: clampPercent(20 + (cellHash % 50)),
    });
  }

  return cells;
}

function buildCoverageIntelligence(
  msa: MSA,
): CoverageIntelligence {
  const bundle = getMarketAnalysisBundle(msa.id);
  const sizing = getMarketSizingForMsa(msa);
  const countyGaps = buildCountyRows(msa, bundle.profile, sizing);
  const penetrationTarget = 25;
  const totalZipCodes = Math.max(bundle.profile.uncoveredZipCodes + 12, 24);

  const countyPenetration = countyGaps.map((row) => ({
    county: row.county,
    pgPenetration: row.pgPenetration,
    patientReach: row.patientReach,
  }));

  const zipHeatmap = buildZipHeatmap(msa, bundle.profile.uncoveredZipCodes, totalZipCodes);

  return { countyGaps, countyPenetration, penetrationTarget, zipHeatmap };
}

function buildBusinessAnalytics(
  msa: MSA,
  coverage: CoverageMetrics,
  competitive: CompetitiveMetrics,
): BusinessAnalytics {
  const bundle = getMarketAnalysisBundle(msa.id);
  const sizing = getMarketSizingForMsa(msa);
  const zipCount = Math.max(bundle.profile.uncoveredZipCodes + 8, 12);
  const hash = hashSeed(msa.id);
  const sla = buildSlaMetrics(msa, sizing.totalPhysicianGroups, hash);

  return {
    coverage: {
      addressablePatientRatio: coverage.patientReach,
      patientAcquisitionEfficiency: clampPercent(msa.conversionRate * 1.1),
      revenuePerZip: msa.revenue > 0 ? Math.round(msa.revenue / zipCount) : 0,
      revenuePerPg:
        msa.physicianGroups > 0 ? Math.round(msa.revenue / msa.physicianGroups) : 0,
      revenuePerHha:
        msa.homeHealthAgencies > 0 ? Math.round(msa.revenue / msa.homeHealthAgencies) : 0,
    },
    market: {
      cagr: bundle.profile.populationGrowthRate,
      hhi: Math.round(competitive.marketConcentrationIndex * 1000) / 10,
      competitiveIntensity: competitive.competitiveIntensityScore,
      referralLeakagePercent: clampPercent(8 + (hash % 12)),
      whitespaceScore: clampPercent(100 - coverage.patientReach),
    },
    operational: {
      ...sla,
      timeToFirstReferralDays: 14 + (hash % 21),
      revenueRealizationLagDays: 32 + (hash % 18),
    },
    risk: {
      clientConcentrationRisk: clampPercent(28 + (hash % 25)),
      countyDependencyIndex: clampPercent(35 + (hash % 30)),
      churnExposure: clampPercent(msa.churnRate * 2.5),
      referralSourceConcentration: clampPercent(40 + (hash % 20)),
    },
    forecast: {
      projectedTam3yr: Math.round(
        computeTam(sizing.addressablePatients, bundle.profile.annualValuePerPatient) *
          (1 + bundle.profile.populationGrowthRate / 100) ** 3,
      ),
      expectedRevenueUplift: Math.round(msa.revenue * 0.18),
      scenarioSensitivity: clampPercent(12 + (hash % 15)),
      revenueSegments: [
        { id: "pg", label: "PG partnerships", value: Math.round(msa.revenue * 0.42) },
        { id: "hha", label: "HHA referrals", value: Math.round(msa.revenue * 0.31) },
        { id: "direct", label: "Direct admits", value: Math.round(msa.revenue * 0.18) },
        { id: "other", label: "Other", value: Math.round(msa.revenue * 0.09) },
      ],
    },
  };
}

function buildReferralNetwork(msa: MSA): ReferralNetworkIntelligence {
  const hash = hashSeed(msa.id);
  const bundle = getMarketAnalysisBundle(msa.id);
  const edges: ReferralNetworkIntelligence["edges"] = [];

  for (let i = 0; i < Math.min(msa.physicianGroups, 5); i += 1) {
    const county = COUNTY_NAMES[i % COUNTY_NAMES.length];
    edges.push({
      from: `${county} PG ${i + 1}`,
      to: `Partner HHA ${(i % msa.homeHealthAgencies) + 1}`,
      county: `${county} County`,
      volume: 40 + (hash % 30) + i * 12,
    });
  }

  const warmOpportunities = COUNTY_NAMES.slice(0, 2).map((c) => `${c} County (via existing PG)`);
  const coldOutreachCounties = COUNTY_NAMES.slice(2).map((c) => `${c} County`);

  const sankeyNodes: ReferralNetworkIntelligence["sankeyNodes"] = [];
  const sankeyLinks: ReferralNetworkIntelligence["sankeyLinks"] = [];
  const pgIds = new Set<string>();
  const hhaIds = new Set<string>();
  const countyIds = new Set<string>();

  edges.forEach((edge) => {
    const pgId = `pg-${edge.from}`;
    const hhaId = `hha-${edge.to}`;
    const countyId = `county-${edge.county}`;
    if (!pgIds.has(pgId)) {
      pgIds.add(pgId);
      sankeyNodes.push({ id: pgId, label: edge.from, column: 0 });
    }
    if (!hhaIds.has(hhaId)) {
      hhaIds.add(hhaId);
      sankeyNodes.push({ id: hhaId, label: edge.to, column: 1 });
    }
    if (!countyIds.has(countyId)) {
      countyIds.add(countyId);
      sankeyNodes.push({ id: countyId, label: edge.county, column: 2 });
    }
    sankeyLinks.push({
      source: pgId,
      target: hhaId,
      value: edge.volume,
      conversionRate: clampPercent(14 + (hashSeed(edge.from) % 8)),
      revenueImpact: Math.round(edge.volume * bundle.profile.annualValuePerPatient * 0.18),
    });
    sankeyLinks.push({
      source: hhaId,
      target: countyId,
      value: Math.round(edge.volume * 0.85),
    });
  });

  return {
    connectedCounties: Math.min(COUNTY_NAMES.length, msa.physicianGroups + 1),
    adjacentExpansionCounties: 2 + (hash % 3),
    clientOverlapPercent: clampPercent(45 + (hash % 30)),
    referralFlowVolume: Math.round(msa.patients * 1.35),
    warmOpportunities,
    coldOutreachCounties,
    edges,
    sankeyNodes,
    sankeyLinks,
  };
}

function buildPgAcquisitionTargets(
  msa: MSA,
  countyGaps: CoverageIntelligence["countyGaps"],
): PgAcquisitionTarget[] {
  const hash = hashSeed(msa.id);
  const bundle = getMarketAnalysisBundle(msa.id);

  return countyGaps.slice(0, 5).map((row, index) => {
    const countyHash = hashSeed(`${msa.id}-pg-${row.county}`);
    const uncoveredPatients = Math.max(row.addressablePatients - row.activePatients, 50);
    const difficulty: PgAcquisitionTarget["acquisitionDifficulty"] =
      index === 0 ? "Medium" : index < 3 ? "Low" : "High";
    const difficultyPenalty = difficulty === "High" ? 15 : difficulty === "Medium" ? 8 : 0;
    const expectedConversionRate = clampPercent(
      (msa.conversionRate > 0 ? msa.conversionRate : 18) + (countyHash % 5),
    );
    const revenuePerPatient = bundle.profile.annualValuePerPatient;
    const estimatedAnnualReferrals = 800 + (countyHash % 600) + index * 120;
    const retentionFactor = clampPercent(100 - msa.churnRate) / 100;
    const estimatedRevenue = Math.max(
      Math.round(uncoveredPatients * revenuePerPatient * 0.15),
      computeOpportunityRevenue(
        estimatedAnnualReferrals,
        expectedConversionRate,
        revenuePerPatient,
        retentionFactor,
      ),
    );

    return {
      county: row.county,
      targetSpecialty: SPECIALTIES[(countyHash + index) % SPECIALTIES.length],
      estimatedPgCount: Math.max(1, Math.round(uncoveredPatients * 0.1)),
      estimatedRevenue,
      estimatedAnnualReferrals,
      expectedConversionRate,
      revenuePerPatient,
      acquisitionDifficulty: difficulty,
      priorityScore: clampPercent(92 - index * 8 - difficultyPenalty + (hash % 5)),
    };
  });
}

function buildPhysicianNetwork(msa: MSA): PhysicianNetworkIntelligence {
  const conversionProb = clampPercent(msa.conversionRate > 0 ? msa.conversionRate : 18) / 100;
  const partnerPgNames = COUNTY_NAMES.slice(0, Math.max(1, msa.physicianGroups)).map(
    (c) => `${c} Partner Physicians`,
  );
  const warmAcquisitionTargets: PhysicianNetworkIntelligence["warmAcquisitionTargets"] = [];

  for (let i = 0; i < 4; i += 1) {
    const county = COUNTY_NAMES[(i + 2) % COUNTY_NAMES.length];
    const targetHash = hashSeed(`${msa.id}-warm-pg-${i}`);
    const shared = 3 + (targetHash % 12);
    const partnerPg = partnerPgNames[i % partnerPgNames.length] ?? "Central Partner Physicians";
    const referralInfluence = clampPercent(55 + (targetHash % 35)) / 100;
    const warmIntroductionScore = clampPercent(
      shared * referralInfluence * conversionProb * 100 * 2.2,
    );
    const estimatedAnnualReferrals = 600 + (targetHash % 700);
    warmAcquisitionTargets.push({
      name: `${county} Medical Associates`,
      county: `${county} County`,
      sharedPhysiciansWithPartner: shared,
      warmIntroductionScore,
      referralInfluenceScore: clampPercent(referralInfluence * 100),
      partnerPgAffiliation: partnerPg,
      acquisitionProbability: clampPercent(warmIntroductionScore * 0.85),
      estimatedAnnualReferrals,
    });
  }

  warmAcquisitionTargets.sort((a, b) => b.warmIntroductionScore - a.warmIntroductionScore);
  const top = warmAcquisitionTargets[0];

  const graphNodes: PhysicianNetworkIntelligence["graphNodes"] = [];
  const graphLinks: PhysicianNetworkIntelligence["graphLinks"] = [];

  partnerPgNames.forEach((name, index) => {
    graphNodes.push({ id: `partner-${index}`, label: name, type: "partner-pg" });
  });

  warmAcquisitionTargets.forEach((target, index) => {
    const targetId = `target-${index}`;
    graphNodes.push({ id: targetId, label: target.name, type: "target-pg" });
    const partnerIndex = index % partnerPgNames.length;
    for (let p = 0; p < Math.min(3, target.sharedPhysiciansWithPartner); p += 1) {
      const physicianId = `physician-${index}-${p}`;
      graphNodes.push({
        id: physicianId,
        label: `Dr. ${COUNTY_NAMES[(index + p) % COUNTY_NAMES.length]}`,
        type: "physician",
      });
      graphLinks.push({ source: physicianId, target: `partner-${partnerIndex}` });
      graphLinks.push({ source: physicianId, target: targetId });
    }
  });

  return {
    sharedPhysicianCount: warmAcquisitionTargets.reduce(
      (sum, t) => sum + t.sharedPhysiciansWithPartner,
      0,
    ),
    warmIntroductionScore: top?.warmIntroductionScore ?? 0,
    referralInfluenceScore: top?.referralInfluenceScore ?? 0,
    warmAcquisitionTargets,
    graphNodes,
    graphLinks,
  };
}

function buildPgFocus(
  msa: MSA,
  pgTargets: PgAcquisitionTarget[],
  physicianNetwork: PhysicianNetworkIntelligence,
): PgAcquisitionFocus {
  const warmTop = physicianNetwork.warmAcquisitionTargets[0];
  const ranked = pgTargets[0];

  if (warmTop && warmTop.warmIntroductionScore >= (ranked?.priorityScore ?? 0)) {
    return {
      targetPg: warmTop.name,
      county: warmTop.county,
      rationale: `${warmTop.sharedPhysiciansWithPartner} physicians overlap with partner PG ${warmTop.partnerPgAffiliation}. Warm introduction score ${warmTop.warmIntroductionScore} — fastest path to referral coverage.`,
    };
  }

  if (ranked) {
    return {
      targetPg: `${ranked.county} ${ranked.targetSpecialty} PG`,
      county: ranked.county,
      rationale: `Highest priority score (${ranked.priorityScore}) with ${formatCurrency(ranked.estimatedRevenue)} revenue potential and ${ranked.acquisitionDifficulty.toLowerCase()} acquisition difficulty.`,
    };
  }

  return {
    targetPg: "Undetermined",
    county: msa.state,
    rationale: "Estimated PG targets based on county coverage gaps.",
  };
}

function buildExecutiveSummary(
  msa: MSA,
  networkMsas: MSA[],
  _coverage: CoverageMetrics,
  competitive: CompetitiveMetrics,
  pgFocus: PgAcquisitionFocus,
): ExecutiveSummary {
  const kpis = buildExecutiveKpis(msa, networkMsas);

  return {
    opportunityScore: kpis.marketOpportunityScore,
    totalAddressableMarket: kpis.totalAddressableMarket,
    annualGrowthRate: kpis.annualGrowthRate,
    competitiveIntensity: competitive.competitiveIntensityScore,
    expansionRecommendation: `Acquire ${pgFocus.targetPg} in ${pgFocus.county}. ${pgFocus.rationale}`,
  };
}

export function buildExecutiveKpis(
  msa: MSA,
  networkMsas: MSA[],
): MarketAnalysisExecutiveKpis {
  const bundle = getMarketAnalysisBundle(msa.id);
  const sizing = getMarketSizingForMsa(msa);
  const { metrics: coverage } = getCoverageContext(msa);
  const tam = computeTam(sizing.addressablePatients, bundle.profile.annualValuePerPatient);
  const tamMillions = tam / 1_000_000;
  const hhaDensity = computeHhaDensity(msa.homeHealthAgencies, bundle.profile.medicarePopulation);
  const opportunityScore = computeOpportunityScore(
    tamMillions,
    bundle.profile.populationGrowthRate,
    hhaDensity,
    bundle.profile.competitiveIntensityScore,
  );
  const activeNetwork = networkMsas.filter((item) => item.status !== "inactive");

  return {
    marketOpportunityScore: opportunityScore,
    totalAddressableMarket: tam,
    currentMarketPenetration: coverage.patientReach,
    annualGrowthRate: bundle.profile.populationGrowthRate,
    competitiveIntensity: bundle.profile.competitiveIntensityScore,
    networkRank: computeNetworkRank(msa, networkMsas),
    networkTotal: activeNetwork.length,
    pgCoverage: coverage.pgPenetration,
    hhaCoverage: coverage.hhaCoverage,
    revenuePerPatient: coverage.revenuePerPatient,
  };
}

export function buildFundamentals(msa: MSA): MarketFundamentalsMetrics {
  const { profile } = getMarketAnalysisBundle(msa.id);
  const sizing = getMarketSizingForMsa(msa);

  return {
    totalPopulation: profile.totalPopulation || msa.population,
    population65Plus: profile.population65Plus,
    medicarePopulation: profile.medicarePopulation,
    populationGrowthRate: profile.populationGrowthRate,
    medianHouseholdIncome: profile.medianHouseholdIncome,
    chronicDiseasePrevalence: profile.chronicDiseasePrevalence,
    populationGrowthTrend: profile.populationGrowthTrend,
    medicareGrowthTrend: profile.medicareGrowthTrend,
    incomeTrend: profile.incomeTrend,
    chronicDiseaseTrend: profile.chronicDiseaseTrend,
    addressablePatients: sizing.addressablePatients,
    addressableAssumptions: sizing.addressableAssumptions,
    estimatedPhysicianGroups: sizing.totalPhysicianGroups,
    estimatedPhysicians: sizing.totalPhysicians,
    estimatedHomeHealthAgencies: sizing.totalHomeHealthAgencies,
  };
}

export function buildProviderLandscape(msa: MSA): ProviderLandscapeMetrics {
  const { sizing, metrics: coverage } = getCoverageContext(msa);
  const activePhysicianGroups = msa.physicianGroups;
  const activeHomeHealthAgencies = msa.homeHealthAgencies;

  return {
    totalPhysicianGroups: sizing.totalPhysicianGroups,
    activePhysicianGroups,
    totalHomeHealthAgencies: sizing.totalHomeHealthAgencies,
    activeHomeHealthAgencies,
    hhaToPgRatio:
      activePhysicianGroups > 0
        ? Math.round((activeHomeHealthAgencies / activePhysicianGroups) * 100) / 100
        : 0,
    averagePatientsPerPg:
      activePhysicianGroups > 0 ? Math.round(msa.patients / activePhysicianGroups) : 0,
    pgCoverage: coverage.pgPenetration,
    hhaCoverage: coverage.hhaCoverage,
    totalPhysicians: sizing.totalPhysicians,
  };
}

export function buildCoverage(msa: MSA): CoverageMetrics {
  const { bundle, sizing, metrics } = getCoverageContext(msa);

  return {
    daPatients: msa.patients,
    totalAddressablePatients: sizing.addressablePatients,
    pgPenetration: metrics.pgPenetration,
    patientReach: metrics.patientReach,
    zipCoverage: metrics.zipCoverage,
    referralCoverage: metrics.referralCoverage,
    uncoveredZipCodes: bundle.profile.uncoveredZipCodes,
    totalZipCodes: metrics.totalZipCodes,
    revenuePerPatient: metrics.revenuePerPatient,
    hhaCoverage: metrics.hhaCoverage,
  };
}

export function buildCompetitive(msa: MSA): CompetitiveMetrics {
  const { profile, competitors } = getMarketAnalysisBundle(msa.id);
  const sizing = getMarketSizingForMsa(msa);
  const enhanced = competitors
    .map((c, i) => enhanceCompetitor(c, i, sizing, msa.id))
    .sort((a, b) => b.estimatedShare - a.estimatedShare);
  const top = enhanced[0];

  return {
    competitorCount: profile.competitorCount,
    marketConcentrationIndex: profile.marketConcentrationIndex,
    largestCompetitorShare: profile.largestCompetitorShare,
    competitiveIntensityScore: profile.competitiveIntensityScore,
    competitors: enhanced,
    overlapSummary: top
      ? `${top.name} overlaps ${formatPercent(top.geographicOverlap)} of our active counties.`
      : "No significant geographic overlap detected.",
    dominantGapZips: profile.uncoveredZipCodes,
    strongestCompetitorCounty: top ? `${top.countiesServed} counties led by ${top.name}` : "—",
  };
}

export function buildScoredOpportunities(msa: MSA): ScoredOpportunity[] {
  const { profile, opportunities } = getMarketAnalysisBundle(msa.id);
  const sizing = getMarketSizingForMsa(msa);
  const hhaDensity = computeHhaDensity(msa.homeHealthAgencies, profile.medicarePopulation);
  const tamMillions = computeTam(sizing.addressablePatients, profile.annualValuePerPatient) / 1_000_000;
  const maxImpact = Math.max(...opportunities.map((o) => o.estimatedRevenueImpact), 1);

  return opportunities
    .map((seed) => {
      const formulaScore = computeOpportunityScore(
        tamMillions,
        profile.populationGrowthRate,
        hhaDensity,
        profile.competitiveIntensityScore,
      );
      const blendedScore = Math.round((seed.baseScore * 0.6 + formulaScore * 0.4) * 10) / 10;
      const effortScore = effortToScore(seed.effortLevel);
      const seedHash = hashSeed(`${msa.id}-${seed.id}`);
      const revenueImpact =
        seed.estimatedRevenueImpact > 0
          ? seed.estimatedRevenueImpact
          : computeOpportunityRevenue(
              900 + (seedHash % 500),
              msa.conversionRate > 0 ? msa.conversionRate : 18,
              profile.annualValuePerPatient,
              clampPercent(100 - msa.churnRate) / 100,
            );
      const revenueScore = Math.round((revenueImpact / Math.max(maxImpact, revenueImpact)) * 100);
      return {
        id: seed.id,
        name: seed.name,
        score: blendedScore,
        estimatedRevenueImpact: revenueImpact,
        effortLevel: seed.effortLevel,
        priority: scoreToPriority(blendedScore),
        effortScore,
        revenueScore,
        quadrant: classifyQuadrant(effortScore, revenueScore),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildOperationalAlerts(
  msa: MSA,
  coverage: CoverageMetrics,
  sla: ReturnType<typeof buildSlaMetrics>,
): OperationalAlert[] {
  if (!isMsaActivated(msa) || msa.status === "inactive" || msa.status === "new-market") {
    return [];
  }

  const retention = clampPercent(100 - msa.churnRate);
  const prevRetention = clampPercent(retention - (msa.status === "growing" ? 1.2 : 2.4));
  const retentionImproved = retention >= prevRetention;
  const profile = resolveMsaDemoProfile(msa);
  const zipGrowth = msa.status === "growing" ? 6 : msa.status === "opportunity" ? 2 : -3;

  const onboardingMessage =
    sla.slaCompliancePercent >= 90
      ? `Average PG onboarding time improved to ${sla.averageOnboardingDays} days (target: ${sla.slaTargetDays} days).`
      : sla.breachPercent >= 10
        ? `${formatPercent(sla.breachPercent)} of PG onboardings exceeded SLA thresholds.`
        : `${formatPercent(sla.slaCompliancePercent)} of PG onboardings met the ${sla.slaTargetDays}-day SLA.`;

  const alerts: OperationalAlert[] = [
    {
      id: "retention",
      message: `Retention ${retentionImproved ? "improved" : "decreased"} ${formatPercent(Math.abs(retention - prevRetention))}.`,
      sentiment:
        msa.status === "growing"
          ? "positive"
          : msa.status === "attention-required"
            ? retention < 92
              ? "negative"
              : "warning"
            : retentionImproved
              ? "positive"
              : retention < 90
                ? "negative"
                : "warning",
      impact: retention < 92 ? "high" : "medium",
      urgency: retention < 90 ? "high" : "medium",
    },
    {
      id: "onboarding",
      message: onboardingMessage,
      sentiment:
        msa.status === "growing"
          ? "positive"
          : msa.status === "attention-required"
            ? sla.breachPercent >= 10
              ? "negative"
              : "warning"
            : sla.slaCompliancePercent >= 88
              ? "positive"
              : sla.breachPercent >= 12
                ? "negative"
                : "warning",
      impact: sla.breachPercent >= 12 ? "high" : "medium",
      urgency: sla.breachPercent >= 15 ? "high" : "medium",
    },
    {
      id: "zip-coverage",
      message:
        zipGrowth >= 0
          ? `ZIP coverage increased ${zipGrowth}% over the prior period.`
          : `ZIP coverage declined ${Math.abs(zipGrowth)}% over the prior period.`,
      sentiment: zipGrowth > 0 ? "positive" : zipGrowth < 0 ? "negative" : "neutral",
      impact: "medium",
      urgency: zipGrowth < 0 ? "medium" : "low",
    },
    {
      id: "coverage-gaps",
      message: `${coverage.uncoveredZipCodes} ZIP codes remain uncovered — ${
        msa.status === "attention-required" ? "high" : "moderate"
      } expansion risk.`,
      sentiment:
        msa.status === "growing"
          ? coverage.uncoveredZipCodes > 15
            ? "warning"
            : "neutral"
          : msa.status === "attention-required"
            ? "negative"
            : "warning",
      impact: coverage.uncoveredZipCodes > 15 ? "high" : "medium",
      urgency: coverage.uncoveredZipCodes > 15 ? "high" : "medium",
    },
    {
      id: "referral-coverage",
      message: `Referral coverage at ${formatPercent(coverage.referralCoverage)} across partner PG pathways.`,
      sentiment:
        coverage.referralCoverage >= 50
          ? "positive"
          : coverage.referralCoverage < 25
            ? "negative"
            : "warning",
      impact: coverage.referralCoverage < 25 ? "high" : "medium",
      urgency: coverage.referralCoverage < 30 ? "high" : "medium",
    },
    {
      id: "concentration",
      message: `Top three clients contribute ${formatPercent(profile.concentrationRiskPct ?? clampPercent(28 + (hashSeed(msa.id) % 25)))} of revenue.`,
      sentiment:
        (profile.concentrationRiskPct ?? 0) > 45
          ? msa.status === "attention-required"
            ? "negative"
            : "warning"
          : "neutral",
      impact: (profile.concentrationRiskPct ?? 0) > 45 ? "high" : "medium",
      urgency: "medium",
    },
  ];

  return alerts.sort((a, b) => {
    const sentimentScore = { negative: 0, warning: 1, neutral: 2, positive: 3 };
    const impactScore = { high: 0, medium: 1, low: 2 };
    const aScore = sentimentScore[a.sentiment] + impactScore[a.impact] * 0.1;
    const bScore = sentimentScore[b.sentiment] + impactScore[b.impact] * 0.1;
    return aScore - bScore;
  });
}

export function buildTrends(msa: MSA): TrendMetric[] {
  if (!isMsaActivated(msa) || msa.status === "inactive") {
    return [];
  }

  const profile = resolveMsaDemoProfile(msa);
  const revenueGrowth = profile.revenueGrowthYoy / 100;
  const patientGrowth = profile.patientGrowthYoy / 100;
  const pgGrowth = profile.referralVolumeGrowthYoy / 100 * 0.6;
  const hhaGrowth = profile.referralVolumeGrowthYoy / 100 * 0.4;
  const retention = clampPercent(100 - msa.churnRate);
  const isEarlyStage = msa.status === "new-market";
  const growthScale = isEarlyStage ? 0.35 : 1;

  return [
    {
      id: "revenue",
      label: "Revenue",
      currentValue: msa.revenue,
      previousQuarter: Math.round(msa.revenue / (1 + revenueGrowth * 0.25)),
      yoyDelta: Math.round(profile.revenueGrowthYoy * growthScale * 10) / 10,
      monthly: generateMonthlySeries(`${msa.id}-rev`, msa.revenue, revenueGrowth * growthScale),
      format: "currency",
    },
    {
      id: "patients",
      label: "Patients",
      currentValue: msa.patients,
      previousQuarter: Math.round(msa.patients / (1 + patientGrowth * 0.25)),
      yoyDelta: profile.patientGrowthYoy,
      monthly: generateMonthlySeries(`${msa.id}-pat`, msa.patients, patientGrowth),
      format: "number",
    },
    {
      id: "pg-acquisition",
      label: "PG Acquisition",
      currentValue: msa.physicianGroups,
      previousQuarter: Math.max(0, msa.physicianGroups - (profile.referralVolumeGrowthYoy > 0 ? 1 : 0)),
      yoyDelta: profile.referralVolumeGrowthYoy,
      monthly: generateMonthlySeries(`${msa.id}-pg`, msa.physicianGroups, pgGrowth),
      format: "number",
    },
    {
      id: "hha-growth",
      label: "HHA Growth",
      currentValue: msa.homeHealthAgencies,
      previousQuarter: Math.max(0, msa.homeHealthAgencies - (profile.referralVolumeGrowthYoy > 0 ? 1 : 0)),
      yoyDelta: Math.round(profile.referralVolumeGrowthYoy * 0.65 * 10) / 10,
      monthly: generateMonthlySeries(`${msa.id}-hha`, msa.homeHealthAgencies, hhaGrowth),
      format: "number",
    },
    {
      id: "retention",
      label: "Retention",
      currentValue: retention,
      previousQuarter: clampPercent(retention - (msa.status === "growing" ? 1.2 : 2.4)),
      yoyDelta: msa.status === "growing" ? 2.1 : msa.status === "attention-required" ? -2.8 : 0.6,
      monthly: generateMonthlySeries(`${msa.id}-ret`, retention, msa.status === "growing" ? 0.01 : -0.005),
      format: "percent",
    },
    {
      id: "referrals",
      label: "Referral Volume",
      currentValue: Math.round(msa.patients * 1.35),
      previousQuarter: Math.round(msa.patients * 1.35 / (1 + profile.referralVolumeGrowthYoy / 100)),
      yoyDelta: profile.referralVolumeGrowthYoy,
      monthly: generateMonthlySeries(
        `${msa.id}-ref`,
        Math.round(msa.patients * 1.35),
        profile.referralVolumeGrowthYoy / 100,
      ),
      format: "number",
    },
  ];
}

export function buildRecommendations(
  msa: MSA,
  opportunities: ScoredOpportunity[],
): MarketRecommendation[] {
  const { profile } = getMarketAnalysisBundle(msa.id);
  const hash = hashSeed(msa.id);
  const recommendations: MarketRecommendation[] = [];

  if (profile.uncoveredZipCodes > 0) {
    recommendations.push({
      id: "zip-outreach",
      action: `Increase outreach in North ${msa.state} underserved ZIPs.`,
      reason: `${profile.uncoveredZipCodes} ZIP codes lack adequate PG coverage.`,
      expectedImpact: `Capture underserved demand in high-opportunity ZIPs.`,
      estimatedEffort: "Medium",
      relatedMetric: "Uncovered ZIP Codes",
      owner: "East Growth Team",
      dueDate: "45 days",
      revenueImpact: 680_000,
      confidence: 82,
      status: "In progress",
      requiredResources: "2 BD reps, territory mapping, referral collateral",
      nextSteps: [
        "Map uncovered ZIPs to county targets",
        "Prioritize ZIPs by opportunity value",
        "Launch outreach sequences",
        "Track referral conversion weekly",
      ],
    });
  }

  const topPg = opportunities.find((o) => o.id === "north-county-pg") ?? opportunities[0];
  if (topPg) {
    const pgName = topPg.name.replace(" Expansion", "");
    recommendations.push({
      id: "pg-acquisition",
      action: `Acquire ${pgName}`,
      reason: `Highest-scored opportunity with ${formatCurrency(topPg.estimatedRevenueImpact)} revenue potential.`,
      expectedImpact: `Estimated ${formatCurrency(topPg.estimatedRevenueImpact)} annual revenue impact.`,
      estimatedEffort: topPg.effortLevel,
      relatedMetric: "Active Physician Groups",
      owner: "PG Acquisition",
      dueDate: "60 days",
      revenueImpact: topPg.estimatedRevenueImpact,
      confidence: 76 + (hash % 12),
      status: "Planned",
      requiredResources: "Acquisition lead, legal review, integration playbook",
      nextSteps: [
        "Identify shared physicians with partner PGs",
        "Request warm introductions",
        "Build outreach sequence",
        "Schedule partnership meetings",
        "Track conversion progress",
      ],
    });
  }

  const hha = opportunities.find((o) => o.id === "underserved-zip");
  if (hha) {
    recommendations.push({
      id: "hha-partnerships",
      action: "Expand HHA partnerships to close coverage gaps.",
      reason: "Referral pathways remain incomplete in underserved counties.",
      expectedImpact: `Strengthen referral coverage in gap counties.`,
      estimatedEffort: hha.effortLevel,
      relatedMetric: "HHA Coverage",
      owner: "Partnerships",
      dueDate: "30 days",
      revenueImpact: hha.estimatedRevenueImpact,
      confidence: 71,
      status: "Open",
      requiredResources: "Partnerships manager, contract templates",
      nextSteps: [
        "Shortlist HHA partners in gap counties",
        "Validate referral volume potential",
        "Execute partnership agreements",
        "Monitor referral activation",
      ],
    });
  }

  return recommendations.slice(0, 3);
}

export function buildMarketAnalysisWorkspace(
  msa: MSA,
  networkMsas: MSA[],
): MarketAnalysisWorkspace {
  const coverage = buildCoverage(msa);
  const competitive = buildCompetitive(msa);
  const opportunities = buildScoredOpportunities(msa);
  const coverageIntelligence = buildCoverageIntelligence(msa);
  const businessAnalytics = buildBusinessAnalytics(msa, coverage, competitive);
  const referralNetwork = buildReferralNetwork(msa);
  const physicianNetwork = buildPhysicianNetwork(msa);
  const pgAcquisitionTargets = buildPgAcquisitionTargets(msa, coverageIntelligence.countyGaps);
  const pgFocus = buildPgFocus(msa, pgAcquisitionTargets, physicianNetwork);
  const opportunityScore = buildExecutiveKpis(msa, networkMsas).marketOpportunityScore;
  const sla = businessAnalytics.operational;

  const scenarioBaseline: ScenarioBaseline = {
    revenue: msa.revenue,
    patients: msa.patients,
    patientReach: coverage.patientReach,
    pgPenetration: coverage.pgPenetration,
    opportunityScore,
  };

  return {
    pgFocus,
    coreKpis: {
      opportunityScore,
      pgPenetration: coverage.pgPenetration,
      patientReach: coverage.patientReach,
      referralCoverage: coverage.referralCoverage,
      zipCoverage: coverage.zipCoverage,
    },
    sla,
    executiveSummary: buildExecutiveSummary(msa, networkMsas, coverage, competitive, pgFocus),
    alerts: buildOperationalAlerts(msa, coverage, sla),
    fundamentals: buildFundamentals(msa),
    coverage,
    coverageIntelligence,
    businessAnalytics,
    competitive,
    physicianNetwork,
    referralNetwork,
    pgAcquisitionTargets,
    opportunityScore: buildExecutiveKpis(msa, networkMsas).marketOpportunityScore,
    opportunities,
    trends: buildTrends(msa),
    scenarioBaseline,
    recommendations: buildRecommendations(msa, opportunities),
  };
}

/** @deprecated Use buildMarketAnalysisWorkspace */
export function buildMarketAnalysisReport(msa: MSA, networkMsas: MSA[]) {
  const workspace = buildMarketAnalysisWorkspace(msa, networkMsas);
  return {
    executiveKpis: buildExecutiveKpis(msa, networkMsas),
    insights: [],
    fundamentals: workspace.fundamentals,
    providerLandscape: buildProviderLandscape(msa),
    coverage: workspace.coverage,
    competitive: workspace.competitive,
    opportunityScore: workspace.opportunityScore,
    opportunities: workspace.opportunities,
    recommendations: workspace.recommendations,
  };
}
