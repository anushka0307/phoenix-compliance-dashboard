export type AccountStatus = "healthy" | "watchlist" | "at-risk";

export type AccountLifecycleStage =
  | "onboarding"
  | "stabilizing"
  | "healthy"
  | "expanding"
  | "strategic";

export type AlertSentiment = "positive" | "warning" | "risk";

export type RelationshipStrength = "strong" | "moderate" | "weak";

export type PersonaCategory =
  | "clinical"
  | "operations"
  | "financial"
  | "executive"
  | "technical";

export interface CsAccountHeader {
  pgId: string;
  pgName: string;
  msaName: string;
  accountOwner: string;
  csmName: string;
  accountStatus: AccountStatus;
  lifecycleStage: AccountLifecycleStage;
  renewalDate: string;
}

export interface CsTopKpis {
  accountHealthScore: number;
  previousHealthScore: number;
  arr: number;
  monthlyRevenue: number;
  valueScore: number;
  rapportScore: number;
  nps: number;
}

export interface CsHealthBreakdown {
  valueFulfilment: number;
  valueCommunication: number;
  rapport: number;
  adoption: number;
  supportExperience: number;
  expansionReadiness: number;
}

export interface CsOverviewMetrics {
  monthlyRecurringRevenue: number;
  claimsProcessed: number;
  claimsAcceptanceRate: number;
  billingTurnaroundDays: number;
  averageResponseTimeHours: number;
  activeUsers: number;
  openTickets: number;
  expansionOpportunities: number;
}

export interface CsAlert {
  id: string;
  message: string;
  sentiment: AlertSentiment;
}

export interface CsBillingPerformance {
  claimsSubmitted: number;
  claimsApproved: number;
  claimsDenied: number;
  denialRate: number;
  avgReimbursementDays: number;
  revenueGenerated: number;
  revenueCaptured: number;
  revenueMissed: number;
  monthlyClaimsTrend: number[];
  monthlyRevenueTrend: number[];
  denialsByReason: { reason: string; count: number }[];
}

export interface CsCodePerformance {
  code: string;
  label: string;
  volume: number;
  revenue: number;
  growthRate: number;
}

export interface CsHhahCoordination {
  activeHhahs: number;
  ordersProcessed: number;
  avgOrderTurnaroundDays: number;
  documentationCompletionRate: number;
  escalationRate: number;
}

export interface CsValueSummary {
  revenueGenerated: number;
  hoursSaved: number;
  adminBurdenReducedPct: number;
  billingCycleImprovementDays: number;
  denialReductionPct: number;
  estimatedQuarterlyValue: number;
}

export interface CsReviewCadence {
  type: "WBR" | "MBR" | "QBR";
  lastDate: string | null;
  nextDate: string | null;
  attendanceRate: number;
  status: "on-track" | "overdue" | "scheduled" | "upcoming";
}

export interface CsMeetingEffectiveness {
  reviewType: "WBR" | "MBR" | "QBR";
  date: string;
  participants: string[];
  topicsCovered: string[];
  actionItems: number;
  followUpCompletionRate: number;
}

export type ExpansionFunnelStage =
  | "Identified"
  | "Qualified"
  | "Discussing"
  | "Proposal sent"
  | "Negotiating"
  | "Won";

export interface CsExecutiveEngagement {
  role: string;
  meetingsAttended: number;
  responseRate: number;
  lastInteraction: string;
}

export interface CsPersonaNode {
  id: string;
  name: string;
  role: string;
  category: PersonaCategory;
  influenceScore: number;
  sentimentScore: number;
  relationshipStrength: RelationshipStrength;
}

export interface CsPersonaLink {
  from: string;
  to: string;
  strength: RelationshipStrength;
}

export interface CsPersonaMatrixRow {
  persona: string;
  owner: string;
  influence: number;
  engagementFrequency: string;
  sentiment: number;
  lastInteraction: string;
  riskLevel: "low" | "medium" | "high";
  missing?: boolean;
}

export interface CsChampionTracker {
  primaryChampion: string;
  executiveSponsor: string | null;
  detractors: string[];
  neutralStakeholders: string[];
  strengthScore: number;
  riskScore: number;
  alerts: string[];
}

export interface CsExpansionOpportunity {
  id: string;
  label: string;
  stage: ExpansionFunnelStage;
  value: number;
  probability: number;
  expectedCloseDate: string;
}

export interface CsCrossSellRecommendation {
  id: string;
  title: string;
  description: string;
  estimatedRevenue: number;
}

export interface CsTicketKpis {
  openTickets: number;
  closedTickets: number;
  slaAdherence: number;
  avgResolutionHours: number;
  escalationRate: number;
  csat: number;
  monthlyTrend: number[];
}

export interface CsSupportCategory {
  category: string;
  volume: number;
  resolutionHours: number;
  satisfaction: number;
}

export interface CsActionItem {
  id: string;
  action: string;
  priority: "high" | "medium" | "low";
  owner: string;
  expectedImpact: string;
  dueDate: string;
}

export interface CsLifecycleGate {
  available: boolean;
  message?: string;
}

export interface CustomerSuccessWorkspace {
  accounts: CsAccountHeader[];
  selectedPgId: string;
  header: CsAccountHeader;
  topKpis: CsTopKpis;
  healthBreakdown: CsHealthBreakdown;
  overviewMetrics: CsOverviewMetrics;
  alerts: CsAlert[];
  billing: CsBillingPerformance;
  codePerformance: CsCodePerformance[];
  hhahCoordination: CsHhahCoordination;
  valueSummary: CsValueSummary;
  reviewCadence: CsReviewCadence[];
  meetingEffectiveness: CsMeetingEffectiveness[];
  executiveEngagement: CsExecutiveEngagement[];
  communicationHealthScore: number;
  rapportScore: number;
  accountMap: { nodes: CsPersonaNode[]; links: CsPersonaLink[] };
  personaMatrix: CsPersonaMatrixRow[];
  championTracker: CsChampionTracker;
  expansionOpportunities: CsExpansionOpportunity[];
  crossSellRecommendations: CsCrossSellRecommendation[];
  ticketKpis: CsTicketKpis;
  supportCategories: CsSupportCategory[];
  actions: CsActionItem[];
  gates: {
    valueFulfilment: CsLifecycleGate;
    valueCommunication: CsLifecycleGate;
    rapport: CsLifecycleGate;
    expansion: CsLifecycleGate;
    tickets: CsLifecycleGate;
  };
}
