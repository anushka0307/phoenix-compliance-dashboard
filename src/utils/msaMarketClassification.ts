import { getMarketAnalysisBundle } from "@/data/marketAnalysisData";
import type { MSA, MsaStatus } from "@/types/msa";
import type {
  MsaClassificationMetadata,
  MsaMarketComponentScores,
} from "@/types/msaClassification";
import { buildCoverage, buildExecutiveKpis } from "@/utils/marketAnalysisHelpers";
import {
  applyDemoProfileToMsaBase,
  isClassificationReady,
  resolveMsaDemoProfile,
} from "@/utils/msaDemoProfiles";
import {
  buildMarketSizing,
  buildSlaMetrics,
  clampPercent,
  hashSeed,
  SLA_TARGET_DAYS,
} from "@/utils/marketCalculations";
import { formatPercent } from "@/utils/format";
import { isMsaActivated } from "@/utils/msaActivation";

export const CLASSIFICATION_WEIGHTS = {
  opportunity: 0.25,
  growth: 0.2,
  referralCoverage: 0.15,
  retention: 0.15,
  operational: 0.1,
  acquisitionReadiness: 0.1,
  competition: 0.05,
} as const;

const SLA_COMPLIANCE_TARGET = 88;
const CONCENTRATION_RISK_THRESHOLD = 45;

export interface MsaMarketSignals {
  opportunityScore: number;
  revenueGrowthYoy: number;
  patientGrowthYoy: number;
  referralVolumeGrowthYoy: number;
  retentionPct: number;
  slaCompliancePct: number;
  averageOnboardingDays: number;
  slaTargetDays: number;
  referralCoveragePct: number;
  pgPenetrationPct: number;
  networkMedianPgPenetration: number;
  competitiveIntensityScore: number;
  concentrationRiskPct: number;
  conversionRate: number;
  criticalAlertRisk: boolean;
  unresolvedRiskCount: number;
}

export interface MsaClassificationResult {
  msaId: string;
  msaName: string;
  status: Exclude<MsaStatus, "inactive">;
  marketHealthScore: number;
  componentScores: MsaMarketComponentScores;
  signals: MsaMarketSignals;
  reasons: string[];
  validationWarnings: string[];
  classificationReady: boolean;
  insufficientDataReasons: string[];
}

const classificationRegistry = new Map<string, MsaClassificationResult>();

export function getMsaClassificationRegistry(): ReadonlyMap<string, MsaClassificationResult> {
  return classificationRegistry;
}

export function getMsaClassification(msaId: string): MsaClassificationResult | undefined {
  return classificationRegistry.get(msaId);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function growthMetricToScore(yoyPercent: number): number {
  return clampPercent(50 + yoyPercent * 4);
}

function getMarketSizingForMsa(msa: MSA) {
  const bundle = getMarketAnalysisBundle(msa.id);
  const population = bundle.profile.totalPopulation || msa.population;
  return buildMarketSizing(
    population,
    bundle.profile.medicarePopulation,
    bundle.profile.chronicDiseasePrevalence,
  );
}

function isActiveOperationalMsa(msa: MSA): boolean {
  return isMsaActivated(msa) && msa.status !== "inactive";
}

export function gatherMsaMarketSignals(msa: MSA, networkMsas: MSA[]): MsaMarketSignals {
  const profile = resolveMsaDemoProfile(msa);
  const bundle = getMarketAnalysisBundle(msa.id);
  const coverage = buildCoverage(msa);
  const kpis = buildExecutiveKpis(msa, networkMsas);
  const sizing = getMarketSizingForMsa(msa);
  const sla = buildSlaMetrics(msa, sizing.totalPhysicianGroups, hashSeed(msa.id));

  const opportunityScore = clampPercent(profile.opportunityScoreTarget || kpis.marketOpportunityScore);
  const referralCoveragePct = clampPercent(profile.referralCoveragePct ?? coverage.referralCoverage);
  const retentionPct = clampPercent(100 - msa.churnRate);

  const activeNetwork = networkMsas.filter(isActiveOperationalMsa);
  const networkPgPenetrations = activeNetwork.map((item) => buildCoverage(item).pgPenetration);
  const concentrationRiskPct = clampPercent(
    profile.concentrationRiskPct ?? 28 + (hashSeed(msa.id) % 25),
  );

  const criticalAlertRisk =
    retentionPct < 90 ||
    profile.revenueGrowthYoy < 0 ||
    referralCoveragePct < 25 ||
    sla.slaCompliancePercent < SLA_COMPLIANCE_TARGET ||
    sla.averageOnboardingDays > sla.slaTargetDays ||
    concentrationRiskPct > CONCENTRATION_RISK_THRESHOLD;

  const unresolvedRiskCount = [
    retentionPct < 90,
    profile.revenueGrowthYoy < 0,
    profile.patientGrowthYoy < 0,
    profile.referralVolumeGrowthYoy < 0,
    referralCoveragePct < 25,
    sla.slaCompliancePercent < SLA_COMPLIANCE_TARGET,
    concentrationRiskPct > CONCENTRATION_RISK_THRESHOLD,
  ].filter(Boolean).length;

  return {
    opportunityScore,
    revenueGrowthYoy: profile.revenueGrowthYoy,
    patientGrowthYoy: profile.patientGrowthYoy,
    referralVolumeGrowthYoy: profile.referralVolumeGrowthYoy,
    retentionPct,
    slaCompliancePct: sla.slaCompliancePercent,
    averageOnboardingDays: sla.averageOnboardingDays,
    slaTargetDays: sla.slaTargetDays || SLA_TARGET_DAYS,
    referralCoveragePct,
    pgPenetrationPct: coverage.pgPenetration,
    networkMedianPgPenetration: median(networkPgPenetrations),
    competitiveIntensityScore: bundle.profile.competitiveIntensityScore,
    concentrationRiskPct,
    conversionRate: msa.conversionRate,
    criticalAlertRisk,
    unresolvedRiskCount,
  };
}

export function computeMsaComponentScores(signals: MsaMarketSignals): MsaMarketComponentScores {
  const growthScore = clampPercent(
    (growthMetricToScore(signals.revenueGrowthYoy) +
      growthMetricToScore(signals.patientGrowthYoy) +
      growthMetricToScore(signals.referralVolumeGrowthYoy)) /
      3,
  );

  const onboardingFactor =
    signals.averageOnboardingDays <= signals.slaTargetDays
      ? 100
      : clampPercent(100 - (signals.averageOnboardingDays - signals.slaTargetDays) * 3);

  const operationalScore = clampPercent(
    signals.slaCompliancePct * 0.7 + onboardingFactor * 0.3,
  );

  const pgVsNetworkScore = clampPercent(
    signals.networkMedianPgPenetration > 0
      ? 50 +
        ((signals.pgPenetrationPct - signals.networkMedianPgPenetration) /
          signals.networkMedianPgPenetration) *
          50
      : signals.pgPenetrationPct,
  );

  const acquisitionReadinessScore = clampPercent(
    pgVsNetworkScore * 0.45 + signals.conversionRate * 1.8 + signals.retentionPct * 0.25,
  );

  const competitionScore = clampPercent(100 - signals.competitiveIntensityScore * 8);

  return {
    opportunityScore: clampPercent(signals.opportunityScore),
    growthScore,
    referralCoverageScore: clampPercent(signals.referralCoveragePct),
    retentionScore: clampPercent(signals.retentionPct),
    operationalScore,
    acquisitionReadinessScore,
    competitionScore,
  };
}

export function computeMarketHealthScore(scores: MsaMarketComponentScores): number {
  return clampPercent(
    scores.opportunityScore * CLASSIFICATION_WEIGHTS.opportunity +
      scores.growthScore * CLASSIFICATION_WEIGHTS.growth +
      scores.referralCoverageScore * CLASSIFICATION_WEIGHTS.referralCoverage +
      scores.retentionScore * CLASSIFICATION_WEIGHTS.retention +
      scores.operationalScore * CLASSIFICATION_WEIGHTS.operational +
      scores.acquisitionReadinessScore * CLASSIFICATION_WEIGHTS.acquisitionReadiness +
      scores.competitionScore * CLASSIFICATION_WEIGHTS.competition,
  );
}

function negativeGrowthCount(signals: MsaMarketSignals): number {
  return [
    signals.revenueGrowthYoy < 0,
    signals.patientGrowthYoy < 0,
    signals.referralVolumeGrowthYoy < 0,
  ].filter(Boolean).length;
}

function meetsGrowingRequirements(signals: MsaMarketSignals): boolean {
  return (
    signals.opportunityScore >= 75 &&
    signals.revenueGrowthYoy > 0 &&
    signals.patientGrowthYoy > 0 &&
    signals.referralVolumeGrowthYoy > 0 &&
    signals.retentionPct >= 95 &&
    signals.referralCoveragePct >= 50 &&
    !signals.criticalAlertRisk
  );
}

function meetsOpportunityRequirements(signals: MsaMarketSignals): boolean {
  return (
    signals.opportunityScore >= 50 &&
    signals.opportunityScore < 75 &&
    negativeGrowthCount(signals) < 2 &&
    signals.retentionPct >= 90
  );
}

function meetsAttentionRequirements(signals: MsaMarketSignals): boolean {
  return (
    signals.opportunityScore < 50 ||
    negativeGrowthCount(signals) >= 2 ||
    signals.retentionPct < 90 ||
    signals.referralCoveragePct < 25 ||
    signals.criticalAlertRisk
  );
}

function buildClassificationReasons(
  signals: MsaMarketSignals,
  status: Exclude<MsaStatus, "inactive">,
  marketHealthScore: number,
): string[] {
  const reasons = [
    `Market health score ${marketHealthScore}`,
    `Opportunity score ${Math.round(signals.opportunityScore)}`,
    `Revenue growth ${signals.revenueGrowthYoy >= 0 ? "+" : ""}${signals.revenueGrowthYoy}%`,
    `Referral coverage ${formatPercent(signals.referralCoveragePct)}`,
    `Retention ${formatPercent(signals.retentionPct)}`,
  ];

  if (status === "growing") {
    reasons.push("Positive trends with strong referral coverage and retention");
  } else if (status === "opportunity") {
    reasons.push("Strong fundamentals with moderate coverage gaps");
  } else if (status === "new-market") {
    reasons.push("Insufficient operational data for full classification");
  } else {
    reasons.push("Operational or market risks require intervention");
  }

  return reasons;
}

function validateClassification(
  status: Exclude<MsaStatus, "inactive">,
  signals: MsaMarketSignals,
  marketHealthScore: number,
): string[] {
  const warnings: string[] = [];

  if (
    status === "attention-required" &&
    signals.revenueGrowthYoy > 0 &&
    signals.retentionPct >= 95 &&
    signals.referralCoveragePct >= 50 &&
    !signals.criticalAlertRisk
  ) {
    warnings.push("Attention Required contradicts positive operational metrics");
  }

  if (
    status === "growing" &&
    (signals.revenueGrowthYoy < 0 ||
      signals.retentionPct < 95 ||
      signals.referralCoveragePct < 50 ||
      signals.criticalAlertRisk)
  ) {
    warnings.push("Growing status contradicts KPI thresholds");
  }

  if (status === "growing" && negativeGrowthCount(signals) >= 2) {
    warnings.push("Growing blocked by multiple negative growth metrics");
  }

  if (status === "attention-required" && marketHealthScore >= 70 && !signals.criticalAlertRisk) {
    warnings.push("Attention Required may contradict composite health score");
  }

  return warnings;
}

function resolveStatusFromSignals(
  signals: MsaMarketSignals,
  marketHealthScore: number,
): Exclude<MsaStatus, "inactive"> {
  if (meetsAttentionRequirements(signals)) {
    return "attention-required";
  }

  if (meetsGrowingRequirements(signals) && marketHealthScore >= 75) {
    return "growing";
  }

  if (
    meetsOpportunityRequirements(signals) ||
    (marketHealthScore >= 50 && marketHealthScore < 75)
  ) {
    return "opportunity";
  }

  if (marketHealthScore >= 75 && negativeGrowthCount(signals) < 2) {
    return "growing";
  }

  return marketHealthScore >= 50 ? "opportunity" : "attention-required";
}

export function toClassificationMetadata(
  result: MsaClassificationResult,
): MsaClassificationMetadata {
  return {
    marketHealthScore: result.marketHealthScore,
    status: result.status,
    classificationReasons: result.reasons,
    componentScores: result.componentScores,
    weights: { ...CLASSIFICATION_WEIGHTS },
    classificationReady: result.classificationReady,
    insufficientDataReasons: result.insufficientDataReasons,
    validationWarnings: result.validationWarnings,
    rawSignals: {
      opportunityScore: result.signals.opportunityScore,
      revenueGrowthYoy: result.signals.revenueGrowthYoy,
      patientGrowthYoy: result.signals.patientGrowthYoy,
      referralVolumeGrowthYoy: result.signals.referralVolumeGrowthYoy,
      retentionPct: result.signals.retentionPct,
      referralCoveragePct: result.signals.referralCoveragePct,
      slaCompliancePct: result.signals.slaCompliancePct,
      criticalAlertRisk: result.signals.criticalAlertRisk,
    },
  };
}

export function classifyMsaMarketHealth(msa: MSA, networkMsas: MSA[]): MsaClassificationResult {
  const demoProfile = resolveMsaDemoProfile(msa);
  const readiness = isClassificationReady(msa, demoProfile);

  if (!readiness.ready || demoProfile.tier === "new-market") {
    const signals = gatherMsaMarketSignals(msa, networkMsas);
    const componentScores = computeMsaComponentScores(signals);
    const marketHealthScore = computeMarketHealthScore(componentScores);

    return {
      msaId: msa.id,
      msaName: msa.name,
      status: "new-market",
      marketHealthScore,
      componentScores,
      signals,
      reasons: [
        "New market — classification deferred",
        ...readiness.reasons,
        "Insufficient data for operational classification",
      ],
      validationWarnings: [],
      classificationReady: false,
      insufficientDataReasons: readiness.reasons,
    };
  }

  const signals = gatherMsaMarketSignals(msa, networkMsas);
  const componentScores = computeMsaComponentScores(signals);
  const marketHealthScore = computeMarketHealthScore(componentScores);
  const status = resolveStatusFromSignals(signals, marketHealthScore);
  const reasons = buildClassificationReasons(signals, status, marketHealthScore);
  const validationWarnings = validateClassification(status, signals, marketHealthScore);

  return {
    msaId: msa.id,
    msaName: msa.name,
    status,
    marketHealthScore,
    componentScores,
    signals,
    reasons,
    validationWarnings,
    classificationReady: true,
    insufficientDataReasons: [],
  };
}

export function logMsaClassification(result: MsaClassificationResult): void {
  if (!import.meta.env.DEV) return;

  console.info(
    "[MSA Classification]",
    JSON.stringify({
      msa: result.msaName,
      status: result.status,
      marketHealthScore: result.marketHealthScore,
      classificationReasons: result.reasons,
      ...(result.validationWarnings.length > 0
        ? { validationWarnings: result.validationWarnings }
        : {}),
    }),
  );
}

export function classifyMsaNetworkStatuses(msas: MSA[]): MSA[] {
  classificationRegistry.clear();

  const tierToStatus = {
    growing: "growing",
    opportunity: "opportunity",
    attention: "attention-required",
    "new-market": "new-market",
  } as const;

  const classified = msas.map((msa) => {
    if (!isMsaActivated(msa)) {
      return { ...msa, status: "inactive" as const };
    }

    const withProfile = applyDemoProfileToMsaBase(msa) as MSA;
    const demoProfile = resolveMsaDemoProfile(withProfile);
    const classification = classifyMsaMarketHealth(withProfile, msas);
    classificationRegistry.set(msa.id, classification);
    logMsaClassification(classification);

    const seed = hashSeed(msa.id);
    const forcedStatus = tierToStatus[demoProfile.tier];
    const forcedHealthScore =
      demoProfile.tier === "growing"
        ? 82 + (seed % 12)
        : demoProfile.tier === "opportunity"
          ? 68 + (seed % 10)
          : demoProfile.tier === "attention"
            ? 42 + (seed % 12)
            : 52 + (seed % 8);

    return {
      ...withProfile,
      status: forcedStatus,
      healthScore: forcedHealthScore,
      classificationMetadata: {
        ...toClassificationMetadata(classification),
        status: forcedStatus,
        marketHealthScore: forcedHealthScore,
      },
    };
  });

  return classified;
}

export { computeMsaComponentScores as computeComponentScores };
