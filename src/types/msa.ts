import type { MsaClassificationMetadata, MsaDemoProfile } from "@/types/msaClassification";

export type MsaStatus =
  | "growing"
  | "opportunity"
  | "attention-required"
  | "new-market"
  | "inactive";

export type ActivationSource = "new_client" | "expansion" | "pilot";

export type OnboardingStatus = "pending" | "in_progress" | "complete";

export type ActivationPipelineStatus = "inactive" | "ready" | "evaluation" | "blocked";

export type DashboardPeriod = "overall" | "30d" | "quarter" | "year" | "custom";

export interface MsaDerivedMetrics {
  patients: number;
  physicianGroups: number;
  physicians: number;
  homeHealthAgencies: number;
}

import type { HhaRelationshipInput, PhysicianGroupActivationInput } from "@/types/pgAcquisition";

export interface ClientActivationData {
  clientName: string;
  msaName: string;
  state: string;
  population: number;
  contractStartDate: string;
  estimatedAnnualRevenue: number;
  primaryContact: string;
  initialAgencies: number;
  notes?: string;
  physicianGroup?: PhysicianGroupActivationInput;
  hhaRelationships?: HhaRelationshipInput[];
}

export interface MsaBase {
  id: string;
  cbsaCode: string;
  name: string;
  state: string;
  status: MsaStatus;
  population: number;
  revenue: number;
  onboardingDays: number;
  conversionRate: number;
  churnRate: number;
  healthScore: number;
  /** Explicit operational counts for activated seed markets. */
  operationalMetrics?: MsaDerivedMetrics;
  activationPipelineStatus?: ActivationPipelineStatus;
  activatedAt?: string;
  activatedBy?: string;
  activationSource?: ActivationSource;
  onboardingStatus?: OnboardingStatus;
  clientData?: ClientActivationData;
  /** Seed-only profile for consistent demo metrics and classification. */
  demoProfile?: MsaDemoProfile;
}

export interface MSA extends MsaBase, MsaDerivedMetrics {
  classificationMetadata?: MsaClassificationMetadata;
}
