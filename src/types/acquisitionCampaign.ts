import type { PgAcquisitionStage } from "@/types/pgAcquisition";

export type CampaignObjective =
  | "pg-acquisition"
  | "zip-coverage-expansion"
  | "referral-coverage-improvement"
  | "competitor-displacement"
  | "specialty-expansion"
  | "upsell-existing-pgs";

export type CampaignType =
  | "cold-outreach"
  | "warm-introduction"
  | "coverage-expansion"
  | "competitor-displacement"
  | "specialty-expansion"
  | "upsell";

export type CampaignChannel =
  | "email"
  | "linkedin"
  | "phone"
  | "events"
  | "webinars"
  | "partner-hha";

export type CampaignStatus = "draft" | "scheduled" | "active" | "completed" | "archived";

export type CampaignLaunchSource =
  | "pg-acquisition"
  | "market-analysis"
  | "executive"
  | "recommendation"
  | "pg-detail"
  | "next-best-action";

export type CampaignPermission = "view" | "create" | "edit" | "launch" | "archive";

export type CampaignFunnelStage =
  | "targeted"
  | "contacted"
  | "responded"
  | "meeting-scheduled"
  | "demo-completed"
  | "negotiation"
  | "onboarding"
  | "active";

export interface CampaignAudienceFilters {
  counties: string[];
  zipCodes: string[];
  specialties: string[];
  acquisitionStages: PgAcquisitionStage[];
  minReferralVolume: number;
  minOpportunityScore: number;
  requireHhaRelationship: boolean;
  existingPartnerOnly: boolean;
  competitorAffiliatedOnly: boolean;
}

export interface CampaignMessagingStep {
  id: string;
  label: string;
  channel: CampaignChannel;
  delayDays: number;
  templateId?: string;
  body: string;
}

export interface CampaignChannelConfig {
  channel: CampaignChannel;
  enabled: boolean;
  priority: number;
  estimatedReach: number;
}

export interface CampaignAudienceMetrics {
  pgCount: number;
  addressablePatients: number;
  estimatedReferralVolume: number;
  estimatedRevenueOpportunity: number;
}

export interface CampaignFunnelMetrics {
  stage: CampaignFunnelStage;
  label: string;
  count: number;
  pipelineValue: number;
  conversionFromPrevious: number | null;
}

export interface CampaignChannelPerformance {
  channel: CampaignChannel;
  openRate: number;
  replyRate: number;
  acceptanceRate: number;
  callConversionRate: number;
  meetingConversionRate: number;
}

export interface CampaignAttribution {
  campaignId: string;
  pgId: string;
  pgName: string;
  channel: CampaignChannel;
  pipelineCreated: number;
  revenueInfluenced: number;
  costPerAcquisition: number;
}

export interface CampaignTask {
  id: string;
  label: string;
  dueLabel: string;
  kind: "follow-up" | "meeting" | "overdue" | "stalled";
}

export interface CampaignKpis {
  targetPgs: number;
  contactedPgs: number;
  responseRate: number;
  meetingsBooked: number;
  demosCompleted: number;
  opportunitiesCreated: number;
  pgsOnboarded: number;
  revenueInfluenced: number;
}

export interface AcquisitionCampaign {
  id: string;
  msaId: string;
  msaName: string;
  name: string;
  objective: CampaignObjective;
  owner: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  launchedAt?: string;
  source: CampaignLaunchSource;
  targetPgIds: string[];
  audienceFilters: CampaignAudienceFilters;
  channels: CampaignChannelConfig[];
  messagingSequence: CampaignMessagingStep[];
  audienceMetrics: CampaignAudienceMetrics;
  estimatedConversionRate: number;
  estimatedPipelineValue: number;
  estimatedRevenueImpact: number;
  kpis: CampaignKpis;
  funnel: CampaignFunnelMetrics[];
  channelPerformance: CampaignChannelPerformance[];
  tasks: CampaignTask[];
  attributions: CampaignAttribution[];
}

export interface CampaignLaunchContext {
  msaId: string;
  msaName: string;
  source: CampaignLaunchSource;
  county?: string;
  targetPgName?: string;
  targetPgIds?: string[];
  suggestedObjective?: CampaignObjective;
  suggestedType?: CampaignType;
  opportunityScoreMin?: number;
  specialty?: string;
  recommendationAction?: string;
}

export interface CampaignDraftInput {
  name: string;
  objective: CampaignObjective;
  owner: string;
  msaId: string;
  msaName: string;
  startDate: string;
  endDate: string;
  type: CampaignType;
  source: CampaignLaunchSource;
  audienceFilters: CampaignAudienceFilters;
  targetPgIds: string[];
  channels: CampaignChannelConfig[];
  messagingSequence: CampaignMessagingStep[];
  audienceMetrics: CampaignAudienceMetrics;
  estimatedConversionRate: number;
  estimatedPipelineValue: number;
  estimatedRevenueImpact: number;
  status: CampaignStatus;
}

export const CAMPAIGN_OBJECTIVES: { id: CampaignObjective; label: string }[] = [
  { id: "pg-acquisition", label: "PG acquisition" },
  { id: "zip-coverage-expansion", label: "ZIP coverage expansion" },
  { id: "referral-coverage-improvement", label: "Referral coverage improvement" },
  { id: "competitor-displacement", label: "Competitor displacement" },
  { id: "specialty-expansion", label: "Specialty expansion" },
  { id: "upsell-existing-pgs", label: "Upsell existing PGs" },
];

export const CAMPAIGN_TYPES: { id: CampaignType; label: string; description: string }[] = [
  { id: "cold-outreach", label: "Cold Outreach", description: "Identified & Awareness stages via email, LinkedIn, phone." },
  { id: "warm-introduction", label: "Warm Introduction", description: "PGs with shared physicians or HHA referral overlap." },
  { id: "coverage-expansion", label: "Coverage Expansion", description: "Low ZIP/referral coverage counties." },
  { id: "competitor-displacement", label: "Competitor Displacement", description: "PGs affiliated with competitors." },
  { id: "specialty-expansion", label: "Specialty Expansion", description: "Underrepresented specialties." },
  { id: "upsell", label: "Upsell Campaign", description: "Active & Expansion PGs for CPO, CCM, RPM." },
];

export const CAMPAIGN_CHANNELS: { id: CampaignChannel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "phone", label: "Phone" },
  { id: "events", label: "Events" },
  { id: "webinars", label: "Webinars" },
  { id: "partner-hha", label: "Partner HHA introductions" },
];

export const CAMPAIGN_FUNNEL_STAGES: { id: CampaignFunnelStage; label: string }[] = [
  { id: "targeted", label: "Targeted" },
  { id: "contacted", label: "Contacted" },
  { id: "responded", label: "Responded" },
  { id: "meeting-scheduled", label: "Meeting Scheduled" },
  { id: "demo-completed", label: "Demo Completed" },
  { id: "negotiation", label: "Negotiation" },
  { id: "onboarding", label: "Onboarding" },
  { id: "active", label: "Active" },
];

export const MESSAGING_TEMPLATES = [
  { id: "intro", label: "Initial outreach", body: "Hi {{pgName}}, we help {{specialty}} groups in {{county}} expand home health referrals through {{sharedHha}}." },
  { id: "follow-up", label: "Follow-up (5 days)", body: "Following up on our referral opportunity for {{pgName}} in {{county}}." },
  { id: "linkedin", label: "LinkedIn connection", body: "Connecting to discuss referral pathways for {{pgName}}." },
  { id: "hha-intro", label: "HHA introduction", body: "Warm introduction via {{sharedHha}} for {{pgName}}." },
  { id: "demo", label: "Demo invitation", body: "Invitation to demo Phoenix for {{pgName}} — {{referralOpportunity}} monthly referrals." },
];

export const CURRENT_CAMPAIGN_USER = {
  name: "Jordan Lee",
  email: "jordan.lee@phoenixhealth.com",
  role: "editor" as const,
};

export function canCampaignAction(permission: CampaignPermission): boolean {
  if (CURRENT_CAMPAIGN_USER.role === "editor") return true;
  return permission === "view";
}

export function getChannelLabel(channel: CampaignChannel): string {
  return CAMPAIGN_CHANNELS.find((item) => item.id === channel)?.label ?? channel;
}

export function getObjectiveLabel(objective: CampaignObjective): string {
  return CAMPAIGN_OBJECTIVES.find((item) => item.id === objective)?.label ?? objective;
}

export function getCampaignTypeLabel(type: CampaignType): string {
  return CAMPAIGN_TYPES.find((item) => item.id === type)?.label ?? type;
}
