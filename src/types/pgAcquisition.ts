export type PgAcquisitionStage =
  | "identified"
  | "awareness"
  | "engaged"
  | "discovery"
  | "demo-scheduled"
  | "evaluation"
  | "negotiation"
  | "onboarding"
  | "active"
  | "expansion";

export type HhaRelationshipStrength = "Strong" | "Moderate" | "Weak" | "Unknown";

export interface PgAcquisitionStageMeta {
  id: PgAcquisitionStage;
  label: string;
  order: number;
  description: string;
}

export const PG_ACQUISITION_STAGES: PgAcquisitionStageMeta[] = [
  { id: "identified", label: "Identified", order: 1, description: "Target PG exists but has no awareness of Phoenix." },
  { id: "awareness", label: "Awareness", order: 2, description: "Initial outreach completed." },
  { id: "engaged", label: "Engaged", order: 3, description: "PG is interacting with content." },
  { id: "discovery", label: "Discovery", order: 4, description: "Active conversations have started." },
  { id: "demo-scheduled", label: "Demo Scheduled", order: 5, description: "Product demonstration planned or completed." },
  { id: "evaluation", label: "Evaluation", order: 6, description: "Commercial and operational review underway." },
  { id: "negotiation", label: "Negotiation", order: 7, description: "Deal is highly active." },
  { id: "onboarding", label: "Onboarding", order: 8, description: "Contract signed; PG is being activated." },
  { id: "active", label: "Active", order: 9, description: "PG is live and generating value." },
  { id: "expansion", label: "Expansion", order: 10, description: "Cross-sell and upsell opportunities." },
];

export interface PgAcquisitionRecord {
  id: string;
  name: string;
  specialty: string;
  stage: PgAcquisitionStage;
  pipelineValue: number;
  daysInStage: number;
  referralVolume: number;
  opportunityScore: number;
  introductionScore: number;
  hhaOverlapCount: number;
  primaryContact?: string;
  createdAt: string;
}

export interface HhaAgencyLink {
  id: string;
  name: string;
  relationshipStrength: HhaRelationshipStrength;
  linkedPgIds: string[];
  referralInfluence: number;
  notes?: string;
}

export interface AcquisitionCampaignMetrics {
  activeCampaigns: number;
  openRate: number;
  meetingConversionRate: number;
  demoConversionRate: number;
}

export interface AcquisitionTaskItem {
  id: string;
  label: string;
  dueLabel: string;
  kind: "follow-up" | "stalled" | "demo" | "overdue";
}

export interface PgAcquisitionWorkspace {
  msaId: string;
  pgs: PgAcquisitionRecord[];
  agencies: HhaAgencyLink[];
  campaigns: AcquisitionCampaignMetrics;
  tasks: AcquisitionTaskItem[];
  campaignsEnabled: boolean;
  customerSuccessEnabled: boolean;
}

export interface PhysicianGroupActivationInput {
  pgName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  specialty: string;
  activeHomeHealthPatients: number;
  estimatedMonthlyReferralVolume: number;
  notes?: string;
}

export interface HhaRelationshipInput {
  hhaId: string;
  hhaName: string;
  relationshipStrength: HhaRelationshipStrength;
  notes?: string;
}

export interface MarketActivationPayload {
  physicianGroup: PhysicianGroupActivationInput;
  hhaRelationships: HhaRelationshipInput[];
}

export function getStageMeta(stage: PgAcquisitionStage): PgAcquisitionStageMeta {
  return PG_ACQUISITION_STAGES.find((item) => item.id === stage) ?? PG_ACQUISITION_STAGES[0];
}

export function getStageLabel(stage: PgAcquisitionStage): string {
  return getStageMeta(stage).label;
}
