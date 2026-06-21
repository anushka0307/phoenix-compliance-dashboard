import type { MsaStatus } from "@/types/msa";

export type MsaDemoTier = "growing" | "opportunity" | "attention" | "new-market";

export interface MsaDemoProfile {
  tier: MsaDemoTier;
  referralCoveragePct: number;
  revenueGrowthYoy: number;
  patientGrowthYoy: number;
  referralVolumeGrowthYoy: number;
  opportunityScoreTarget: number;
  classificationReady?: boolean;
  concentrationRiskPct?: number;
}

export interface MsaMarketComponentScores {
  opportunityScore: number;
  growthScore: number;
  referralCoverageScore: number;
  retentionScore: number;
  operationalScore: number;
  acquisitionReadinessScore: number;
  competitionScore: number;
}

export interface MsaClassificationMetadata {
  marketHealthScore: number;
  status: Exclude<MsaStatus, "inactive">;
  classificationReasons: string[];
  componentScores: MsaMarketComponentScores;
  weights: Record<string, number>;
  classificationReady: boolean;
  insufficientDataReasons: string[];
  validationWarnings: string[];
  rawSignals: {
    opportunityScore: number;
    revenueGrowthYoy: number;
    patientGrowthYoy: number;
    referralVolumeGrowthYoy: number;
    retentionPct: number;
    referralCoveragePct: number;
    slaCompliancePct: number;
    criticalAlertRisk: boolean;
  };
}
