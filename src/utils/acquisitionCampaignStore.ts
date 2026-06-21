import type { MSA } from "@/types/msa";
import type { PgAcquisitionRecord } from "@/types/pgAcquisition";
import type {
  AcquisitionCampaign,
  CampaignAudienceFilters,
  CampaignAudienceMetrics,
  CampaignChannel,
  CampaignChannelConfig,
  CampaignChannelPerformance,
  CampaignDraftInput,
  CampaignFunnelMetrics,
  CampaignKpis,
  CampaignLaunchContext,
  CampaignMessagingStep,
  CampaignType,
} from "@/types/acquisitionCampaign";
import {
  CAMPAIGN_FUNNEL_STAGES,
  CURRENT_CAMPAIGN_USER,
} from "@/types/acquisitionCampaign";
import type { PgAcquisitionFocus, MarketRecommendation, PgAcquisitionTarget } from "@/types/marketAnalysis";
import { getPgAcquisitionWorkspace } from "@/utils/pgAcquisitionStore";
import { hashSeed } from "@/utils/marketCalculations";
import { isMsaActivated } from "@/utils/msaActivation";
import {
  loadPersistedCampaigns,
  savePersistedCampaignsForMsa,
} from "@/utils/demoPersistence";

const campaignsByMsa = new Map<string, AcquisitionCampaign[]>();

const hydratedCampaigns = loadPersistedCampaigns();
for (const [msaId, campaigns] of Object.entries(hydratedCampaigns)) {
  campaignsByMsa.set(msaId, campaigns);
}

function rememberCampaigns(msaId: string, campaigns: AcquisitionCampaign[]): void {
  campaignsByMsa.set(msaId, campaigns);
  savePersistedCampaignsForMsa(msaId, campaigns);
}

export function getDefaultAudienceFilters(): CampaignAudienceFilters {
  return {
    counties: [],
    zipCodes: [],
    specialties: [],
    acquisitionStages: [],
    minReferralVolume: 0,
    minOpportunityScore: 0,
    requireHhaRelationship: false,
    existingPartnerOnly: false,
    competitorAffiliatedOnly: false,
  };
}

export function getDefaultMessagingSequence(type: CampaignType): CampaignMessagingStep[] {
  const base: CampaignMessagingStep[] = [
    { id: "step-1", label: "Initial outreach", channel: "email", delayDays: 0, templateId: "intro", body: MESSAGING_BODY.intro },
    { id: "step-2", label: "Follow-up after 5 days", channel: "email", delayDays: 5, templateId: "follow-up", body: MESSAGING_BODY.followUp },
    { id: "step-3", label: "LinkedIn connection", channel: "linkedin", delayDays: 7, templateId: "linkedin", body: MESSAGING_BODY.linkedin },
    { id: "step-4", label: "HHA introduction", channel: "partner-hha", delayDays: 10, templateId: "hha-intro", body: MESSAGING_BODY.hhaIntro },
    { id: "step-5", label: "Demo invitation", channel: "email", delayDays: 14, templateId: "demo", body: MESSAGING_BODY.demo },
  ];

  if (type === "cold-outreach") return base;
  if (type === "warm-introduction") {
    return [
      { id: "step-1", label: "Partner HHA introduction", channel: "partner-hha", delayDays: 0, templateId: "hha-intro", body: MESSAGING_BODY.hhaIntro },
      { id: "step-2", label: "Follow-up email", channel: "email", delayDays: 3, templateId: "follow-up", body: MESSAGING_BODY.followUp },
      { id: "step-3", label: "Meeting request", channel: "phone", delayDays: 7, templateId: "intro", body: MESSAGING_BODY.intro },
    ];
  }
  if (type === "upsell") {
    return [
      { id: "step-1", label: "CPO/CCM expansion email", channel: "email", delayDays: 0, templateId: "intro", body: "Expand services for {{pgName}} — CPO, CCM, RPM opportunities." },
      { id: "step-2", label: "Webinar invite", channel: "webinars", delayDays: 5, templateId: "demo", body: MESSAGING_BODY.demo },
    ];
  }
  return base.slice(0, 4);
}

const MESSAGING_BODY = {
  intro: "Hi {{pgName}}, we help {{specialty}} groups in {{county}} expand home health referrals.",
  followUp: "Following up on our referral opportunity for {{pgName}} in {{county}}.",
  linkedin: "Connecting to discuss referral pathways for {{pgName}}.",
  hhaIntro: "Warm introduction via {{sharedHha}} for {{pgName}}.",
  demo: "Invitation to demo Phoenix for {{pgName}} — {{referralOpportunity}} monthly referrals.",
};

export function getDefaultChannels(type: CampaignType, audienceSize: number): CampaignChannelConfig[] {
  const reach = Math.max(1, audienceSize);
  const configs: Record<CampaignType, CampaignChannel[]> = {
    "cold-outreach": ["email", "linkedin", "phone"],
    "warm-introduction": ["partner-hha", "email", "phone"],
    "coverage-expansion": ["email", "events", "webinars"],
    "competitor-displacement": ["email", "linkedin", "phone"],
    "specialty-expansion": ["email", "webinars", "events"],
    upsell: ["email", "webinars", "phone"],
  };
  return configs[type].map((channel, index) => ({
    channel,
    enabled: true,
    priority: index + 1,
    estimatedReach: Math.round(reach * (0.9 - index * 0.15)),
  }));
}

export function filterAudiencePgs(
  pgs: PgAcquisitionRecord[],
  filters: CampaignAudienceFilters,
): PgAcquisitionRecord[] {
  return pgs.filter((pg) => {
    if (filters.specialties.length > 0 && !filters.specialties.includes(pg.specialty)) return false;
    if (filters.acquisitionStages.length > 0 && !filters.acquisitionStages.includes(pg.stage)) return false;
    if (pg.referralVolume < filters.minReferralVolume) return false;
    if (pg.opportunityScore < filters.minOpportunityScore) return false;
    if (filters.requireHhaRelationship && pg.hhaOverlapCount < 1) return false;
    if (filters.existingPartnerOnly && !["active", "expansion", "onboarding"].includes(pg.stage)) return false;
    if (filters.competitorAffiliatedOnly && pg.opportunityScore < 50) return false;
    return true;
  });
}

export function computeAudienceMetrics(
  pgs: PgAcquisitionRecord[],
  msa: MSA,
): CampaignAudienceMetrics {
  const referralVolume = pgs.reduce((sum, pg) => sum + pg.referralVolume, 0);
  const pipeline = pgs.reduce((sum, pg) => sum + pg.pipelineValue, 0);
  return {
    pgCount: pgs.length,
    addressablePatients: Math.round(pgs.length * 420 + msa.patients * 0.02),
    estimatedReferralVolume: referralVolume,
    estimatedRevenueOpportunity: pipeline || Math.round(referralVolume * 390 * 12),
  };
}

function buildCampaignFunnel(targetCount: number, seed: number): CampaignFunnelMetrics[] {
  let prev = Math.max(targetCount, 1);
  return CAMPAIGN_FUNNEL_STAGES.map((stage, index) => {
    const count =
      index === 0
        ? targetCount
        : Math.max(0, Math.round(prev * (0.68 + (hashSeed(`${seed}-${index}`) % 8) * 0.01)));
    const conversionFromPrevious =
      index === 0 ? null : prev > 0 ? Math.round((count / prev) * 100) : 0;
    const pipelineValue = Math.round(count * (180_000 + (hashSeed(stage.id) % 80_000)));
    prev = count;
    return {
      stage: stage.id,
      label: stage.label,
      count,
      pipelineValue,
      conversionFromPrevious,
    };
  });
}

function buildChannelPerformance(channels: CampaignChannelConfig[], seed: number): CampaignChannelPerformance[] {
  return channels
    .filter((c) => c.enabled)
    .map((config) => {
      const s = hashSeed(`${seed}-${config.channel}`);
      return {
        channel: config.channel,
        openRate: 18 + (s % 22),
        replyRate: 6 + (s % 12),
        acceptanceRate: config.channel === "linkedin" ? 28 + (s % 18) : 0,
        callConversionRate: config.channel === "phone" ? 14 + (s % 10) : 0,
        meetingConversionRate: 8 + (s % 14),
      };
    });
}

function buildCampaignKpis(funnel: CampaignFunnelMetrics[], revenue: number): CampaignKpis {
  const targeted = funnel.find((f) => f.stage === "targeted")?.count ?? 0;
  const contacted = funnel.find((f) => f.stage === "contacted")?.count ?? 0;
  const responded = funnel.find((f) => f.stage === "responded")?.count ?? 0;
  const meetings = funnel.find((f) => f.stage === "meeting-scheduled")?.count ?? 0;
  const demos = funnel.find((f) => f.stage === "demo-completed")?.count ?? 0;
  const negotiation = funnel.find((f) => f.stage === "negotiation")?.count ?? 0;
  const onboarding = funnel.find((f) => f.stage === "onboarding")?.count ?? 0;
  const active = funnel.find((f) => f.stage === "active")?.count ?? 0;

  return {
    targetPgs: targeted,
    contactedPgs: contacted,
    responseRate: contacted > 0 ? Math.round((responded / contacted) * 100) : 0,
    meetingsBooked: meetings,
    demosCompleted: demos,
    opportunitiesCreated: negotiation + demos,
    pgsOnboarded: onboarding + active,
    revenueInfluenced: revenue,
  };
}

function buildAttributions(
  campaign: Pick<AcquisitionCampaign, "id" | "targetPgIds">,
  pgs: PgAcquisitionRecord[],
  channels: CampaignChannelConfig[],
): AcquisitionCampaign["attributions"] {
  const primaryChannel = channels.find((c) => c.enabled)?.channel ?? "email";
  return campaign.targetPgIds.slice(0, 6).map((pgId, index) => {
    const pg = pgs.find((item) => item.id === pgId);
    const seed = hashSeed(`${campaign.id}-${pgId}`);
    return {
      campaignId: campaign.id,
      pgId,
      pgName: pg?.name ?? `PG ${index + 1}`,
      channel: channels[index % channels.length]?.channel ?? primaryChannel,
      pipelineCreated: pg?.pipelineValue ?? 120_000 + seed % 50_000,
      revenueInfluenced: Math.round((pg?.pipelineValue ?? 100_000) * 0.35),
      costPerAcquisition: 1200 + (seed % 800),
    };
  });
}

function buildCampaignTasks(campaignName: string, status: AcquisitionCampaign["status"]): AcquisitionCampaign["tasks"] {
  if (status === "draft") {
    return [{ id: "draft-review", label: `Review draft: ${campaignName}`, dueLabel: "When ready", kind: "follow-up" }];
  }
  return [
    { id: "follow-up-1", label: "Follow up on outreach sequence", dueLabel: "Due today", kind: "follow-up" },
    { id: "meeting-1", label: "Discovery meeting with top target PG", dueLabel: "Tomorrow", kind: "meeting" },
    { id: "stalled-1", label: "Re-engage stalled opportunity", dueLabel: "3 days overdue", kind: "stalled" },
  ];
}

function campaignFromDraft(
  input: CampaignDraftInput,
  existingId?: string,
  pgs: PgAcquisitionRecord[] = [],
): AcquisitionCampaign {
  const id = existingId ?? `${input.msaId}-campaign-${Date.now()}`;
  const seed = hashSeed(id);
  const funnel = buildCampaignFunnel(input.audienceMetrics.pgCount, seed);
  const channels = input.channels.filter((c) => c.enabled);

  const campaign: AcquisitionCampaign = {
    id,
    msaId: input.msaId,
    msaName: input.msaName,
    name: input.name,
    objective: input.objective,
    owner: input.owner,
    type: input.type,
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: new Date().toISOString(),
    launchedAt: input.status === "active" ? new Date().toISOString() : undefined,
    source: input.source,
    targetPgIds: input.targetPgIds,
    audienceFilters: input.audienceFilters,
    channels: input.channels,
    messagingSequence: input.messagingSequence,
    audienceMetrics: input.audienceMetrics,
    estimatedConversionRate: input.estimatedConversionRate,
    estimatedPipelineValue: input.estimatedPipelineValue,
    estimatedRevenueImpact: input.estimatedRevenueImpact,
    kpis: buildCampaignKpis(funnel, input.estimatedRevenueImpact),
    funnel,
    channelPerformance: buildChannelPerformance(channels, seed),
    tasks: buildCampaignTasks(input.name, input.status),
    attributions: buildAttributions({ id, targetPgIds: input.targetPgIds }, pgs, channels),
  };

  return campaign;
}

export function getCampaignsForMsa(msaId: string): AcquisitionCampaign[] {
  return campaignsByMsa.get(msaId) ?? [];
}

export function getCampaignById(msaId: string, campaignId: string): AcquisitionCampaign | undefined {
  return getCampaignsForMsa(msaId).find((c) => c.id === campaignId);
}

export function saveCampaign(
  input: CampaignDraftInput,
  existingId?: string,
  pgs: PgAcquisitionRecord[] = [],
): AcquisitionCampaign {
  const campaign = campaignFromDraft(input, existingId, pgs);
  const list = campaignsByMsa.get(input.msaId) ?? [];
  const next = existingId
    ? list.map((item) => (item.id === existingId ? campaign : item))
    : [...list, campaign];
  rememberCampaigns(input.msaId, next);
  return campaign;
}

export function duplicateCampaign(msaId: string, campaignId: string): AcquisitionCampaign | undefined {
  const source = getCampaignById(msaId, campaignId);
  if (!source) return undefined;
  return saveCampaign({
    name: `${source.name} (Copy)`,
    objective: source.objective,
    owner: source.owner,
    msaId: source.msaId,
    msaName: source.msaName,
    startDate: source.startDate,
    endDate: source.endDate,
    type: source.type,
    source: source.source,
    audienceFilters: { ...source.audienceFilters },
    targetPgIds: [...source.targetPgIds],
    channels: source.channels.map((c) => ({ ...c })),
    messagingSequence: source.messagingSequence.map((s) => ({ ...s })),
    audienceMetrics: { ...source.audienceMetrics },
    estimatedConversionRate: source.estimatedConversionRate,
    estimatedPipelineValue: source.estimatedPipelineValue,
    estimatedRevenueImpact: source.estimatedRevenueImpact,
    status: "draft",
  });
}

export function archiveCampaign(msaId: string, campaignId: string): void {
  const list = getCampaignsForMsa(msaId);
  rememberCampaigns(
    msaId,
    list.map((c) => (c.id === campaignId ? { ...c, status: "archived" as const } : c)),
  );
}

export function seedCampaignsForMsa(msa: MSA, pgs: PgAcquisitionRecord[]): void {
  if (!isMsaActivated(msa) || getCampaignsForMsa(msa.id).length > 0) return;
  if (pgs.length === 0) return;

  const targetIds = pgs.slice(0, 5).map((pg) => pg.id);
  const filters = getDefaultAudienceFilters();
  const metrics = computeAudienceMetrics(
    pgs.filter((pg) => targetIds.includes(pg.id)),
    msa,
  );

  saveCampaign(
    {
      name: `${msa.name.split(",")[0]} Q2 PG Outreach`,
      objective: "pg-acquisition",
      owner: CURRENT_CAMPAIGN_USER.name,
      msaId: msa.id,
      msaName: msa.name,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10),
      type: "cold-outreach",
      source: "pg-acquisition",
      audienceFilters: filters,
      targetPgIds: targetIds,
      channels: getDefaultChannels("cold-outreach", metrics.pgCount),
      messagingSequence: getDefaultMessagingSequence("cold-outreach"),
      audienceMetrics: metrics,
      estimatedConversionRate: 18,
      estimatedPipelineValue: metrics.estimatedRevenueOpportunity,
      estimatedRevenueImpact: Math.round(metrics.estimatedRevenueOpportunity * 0.4),
      status: "active",
    },
    undefined,
    pgs,
  );
}

export function buildLaunchContextFromMsa(
  msa: MSA,
  partial: Partial<CampaignLaunchContext> & { source: CampaignLaunchContext["source"] },
): CampaignLaunchContext {
  const workspace = getPgAcquisitionWorkspace(msa);
  seedCampaignsForMsa(msa, workspace.pgs);

  return {
    msaId: msa.id,
    msaName: msa.name,
    source: partial.source,
    county: partial.county,
    targetPgName: partial.targetPgName,
    targetPgIds: partial.targetPgIds ?? workspace.pgs.slice(0, 3).map((pg) => pg.id),
    suggestedObjective: partial.suggestedObjective ?? "pg-acquisition",
    suggestedType: partial.suggestedType ?? "cold-outreach",
    opportunityScoreMin: partial.opportunityScoreMin ?? 45,
    specialty: partial.specialty,
    recommendationAction: partial.recommendationAction,
  };
}

export function buildLaunchContextFromFocus(
  msa: MSA,
  focus: PgAcquisitionFocus,
): CampaignLaunchContext {
  return buildLaunchContextFromMsa(msa, {
    source: "next-best-action",
    county: focus.county,
    targetPgName: focus.targetPg,
    suggestedType: focus.rationale.toLowerCase().includes("warm") ? "warm-introduction" : "cold-outreach",
    suggestedObjective: "pg-acquisition",
  });
}

export function buildLaunchContextFromRecommendation(
  msa: MSA,
  recommendation: MarketRecommendation,
): CampaignLaunchContext {
  const typeMap: Record<string, CampaignType> = {
    "pg-acquisition": "cold-outreach",
    "coverage": "coverage-expansion",
    "competitor": "competitor-displacement",
  };
  const suggestedType =
    Object.entries(typeMap).find(([key]) => recommendation.id.includes(key))?.[1] ?? "cold-outreach";

  return buildLaunchContextFromMsa(msa, {
    source: "recommendation",
    suggestedObjective: recommendation.id.includes("upsell") ? "upsell-existing-pgs" : "pg-acquisition",
    suggestedType,
    recommendationAction: recommendation.action,
    opportunityScoreMin: 50,
  });
}

export function buildLaunchContextFromTarget(
  msa: MSA,
  target: PgAcquisitionTarget,
): CampaignLaunchContext {
  return buildLaunchContextFromMsa(msa, {
    source: "market-analysis",
    county: target.county,
    specialty: target.targetSpecialty,
    suggestedObjective: "pg-acquisition",
    suggestedType: "specialty-expansion",
    opportunityScoreMin: target.priorityScore,
  });
}

export function getAggregateCampaignMetrics(msaId: string) {
  const campaigns = getCampaignsForMsa(msaId).filter((c) => c.status === "active");
  if (campaigns.length === 0) {
    return { activeCampaigns: 0, openRate: 0, meetingConversionRate: 0, demoConversionRate: 0 };
  }
  const openRates = campaigns.flatMap((c) => c.channelPerformance.map((p) => p.openRate));
  const meetingRates = campaigns.flatMap((c) => c.channelPerformance.map((p) => p.meetingConversionRate));
  const demoRates = campaigns.flatMap((c) =>
    c.funnel
      .filter((f) => f.stage === "demo-completed")
      .map((f) => f.conversionFromPrevious ?? 0),
  );
  const avg = (values: number[]) =>
    values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  return {
    activeCampaigns: campaigns.length,
    openRate: avg(openRates),
    meetingConversionRate: avg(meetingRates),
    demoConversionRate: avg(demoRates) || 12,
  };
}

export function canLaunchCampaign(msa: MSA): boolean {
  if (!isMsaActivated(msa) || msa.status === "inactive") return false;
  const workspace = getPgAcquisitionWorkspace(msa);
  return workspace.pgs.length > 0;
}
