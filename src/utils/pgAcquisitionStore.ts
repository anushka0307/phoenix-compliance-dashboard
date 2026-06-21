import type { MSA } from "@/types/msa";
import type {
  AcquisitionCampaignMetrics,
  AcquisitionTaskItem,
  HhaAgencyLink,
  PgAcquisitionRecord,
  PgAcquisitionStage,
  PgAcquisitionWorkspace,
} from "@/types/pgAcquisition";
import { PG_ACQUISITION_STAGES } from "@/types/pgAcquisition";
import type { MarketActivationPayload } from "@/types/pgAcquisition";
import { hashSeed } from "@/utils/marketCalculations";
import { isMsaActivated } from "@/utils/msaActivation";
import { enrichAcquisitionPgsForDemo } from "@/utils/customerSuccessDemoSeed";
import {
  loadPersistedPgWorkspaces,
  savePersistedPgWorkspace,
} from "@/utils/demoPersistence";

const workspaces = new Map<string, PgAcquisitionWorkspace>();

const hydratedWorkspaces = loadPersistedPgWorkspaces();
for (const [msaId, workspace] of Object.entries(hydratedWorkspaces)) {
  workspaces.set(msaId, workspace);
}

function rememberWorkspace(workspace: PgAcquisitionWorkspace): PgAcquisitionWorkspace {
  workspaces.set(workspace.msaId, workspace);
  savePersistedPgWorkspace(workspace);
  return workspace;
}

const HHA_NAME_PREFIXES = [
  "Summit Home Health",
  "CareBridge",
  "Heritage HH",
  "Valley Visiting Nurses",
  "Premier Home Care",
  "Community Health Partners",
  "Guardian Home Health",
  "Harmony Care",
];

const PG_NAME_SUFFIXES = ["Medical Group", "Physicians", "Primary Care", "Health Partners", "Associates"];

function stageDistribution(seed: number): PgAcquisitionStage[] {
  const stages: PgAcquisitionStage[] = [];
  const weights: PgAcquisitionStage[] = [
    "identified",
    "awareness",
    "engaged",
    "discovery",
    "demo-scheduled",
    "evaluation",
    "negotiation",
    "onboarding",
    "active",
    "expansion",
  ];

  const count = 6 + (seed % 8);
  for (let i = 0; i < count; i += 1) {
    const idx = Math.min(weights.length - 1, Math.floor((i + (seed % 3)) / 2));
    stages.push(weights[idx]);
  }
  return stages;
}

function buildSeedPgs(msa: MSA): PgAcquisitionRecord[] {
  const seed = hashSeed(msa.id);
  const stages = stageDistribution(seed);
  const baseValue = Math.max(120_000, Math.round(msa.revenue / Math.max(msa.physicianGroups, 4)));

  return stages.map((stage, index) => {
    const pgSeed = hashSeed(`${msa.id}-pg-${index}`);
    const prefix = ["North", "Central", "East", "West", "Metro"][pgSeed % 5];
    const suffix = PG_NAME_SUFFIXES[pgSeed % PG_NAME_SUFFIXES.length];
    return {
      id: `${msa.id}-pg-${index}`,
      name: `${prefix} ${suffix}`,
      specialty: ["Primary Care", "Cardiology", "Geriatrics", "Internal Medicine"][pgSeed % 4],
      stage,
      pipelineValue: Math.round(baseValue * (0.6 + (pgSeed % 50) / 100)),
      daysInStage: 4 + (pgSeed % 28),
      referralVolume: 40 + (pgSeed % 180),
      opportunityScore: 45 + (pgSeed % 50),
      introductionScore: 30 + (pgSeed % 65),
      hhaOverlapCount: 1 + (pgSeed % 4),
      createdAt: new Date(Date.now() - (index + 2) * 86_400_000).toISOString(),
    };
  });
}

function buildSeedAgencies(msa: MSA, pgs: PgAcquisitionRecord[]): HhaAgencyLink[] {
  const count = Math.max(3, Math.min(10, (msa.homeHealthAgencies || 4) + 2));

  return Array.from({ length: count }, (_, index) => {
    const seed = hashSeed(`${msa.id}-hha-${index}`);
    const strengths: HhaAgencyLink["relationshipStrength"][] = ["Strong", "Moderate", "Weak", "Unknown"];
    const linkedPgIds = pgs
      .filter((_, pgIndex) => (seed + pgIndex) % 3 === 0)
      .slice(0, 3)
      .map((pg) => pg.id);
    return {
      id: `${msa.id}-hha-${index}`,
      name: `${HHA_NAME_PREFIXES[seed % HHA_NAME_PREFIXES.length]} (${msa.state})`,
      relationshipStrength: strengths[seed % strengths.length],
      linkedPgIds,
      referralInfluence: 20 + (seed % 70),
      notes: seed % 2 === 0 ? "Established referral pathway" : undefined,
    };
  });
}

function buildCampaignMetrics(pgs: PgAcquisitionRecord[]): AcquisitionCampaignMetrics {
  const activeStages = pgs.filter((pg) =>
    ["awareness", "engaged", "discovery", "demo-scheduled", "evaluation", "negotiation"].includes(pg.stage),
  );
  return {
    activeCampaigns: Math.max(1, Math.round(activeStages.length / 2)),
    openRate: pgs.length > 0 ? 24 + (hashSeed(pgs[0].id) % 18) : 0,
    meetingConversionRate: pgs.length > 0 ? 12 + (hashSeed(pgs[0].id) % 10) : 0,
    demoConversionRate: pgs.length > 0 ? 8 + (hashSeed(pgs[0].id) % 8) : 0,
  };
}

function buildTasks(pgs: PgAcquisitionRecord[]): AcquisitionTaskItem[] {
  const tasks: AcquisitionTaskItem[] = [];
  pgs
    .filter((pg) => pg.daysInStage > 18)
    .slice(0, 2)
    .forEach((pg) => {
      tasks.push({
        id: `stalled-${pg.id}`,
        label: `${pg.name} stalled in ${pg.stage}`,
        dueLabel: `${pg.daysInStage} days in stage`,
        kind: "stalled",
      });
    });
  pgs
    .filter((pg) => pg.stage === "demo-scheduled")
    .slice(0, 2)
    .forEach((pg) => {
      tasks.push({
        id: `demo-${pg.id}`,
        label: `Demo scheduled with ${pg.name}`,
        dueLabel: "Upcoming",
        kind: "demo",
      });
    });
  if (tasks.length < 3) {
    tasks.push({
      id: "follow-up-1",
      label: "Follow up on discovery calls",
      dueLabel: "Due today",
      kind: "follow-up",
    });
  }
  return tasks.slice(0, 5);
}

function buildWorkspace(msa: MSA): PgAcquisitionWorkspace {
  let pgs =
    msa.physicianGroups > 0 && isMsaActivated(msa) ? buildSeedPgs(msa) : [];
  pgs = enrichAcquisitionPgsForDemo(msa, pgs);
  const agencies = buildSeedAgencies(msa, pgs);
  const hasPg = pgs.length > 0;
  const hasOnboardedPg = pgs.some((pg) =>
    ["onboarding", "active", "expansion"].includes(pg.stage),
  );

  return {
    msaId: msa.id,
    pgs,
    agencies,
    campaigns: buildCampaignMetrics(pgs),
    tasks: buildTasks(pgs),
    campaignsEnabled: hasPg,
    customerSuccessEnabled: hasOnboardedPg,
  };
}

export function getPgAcquisitionWorkspace(msa: MSA): PgAcquisitionWorkspace {
  const existing = workspaces.get(msa.id);
  if (existing) return existing;

  if (!isMsaActivated(msa)) {
    const empty: PgAcquisitionWorkspace = {
      msaId: msa.id,
      pgs: [],
      agencies: [],
      campaigns: { activeCampaigns: 0, openRate: 0, meetingConversionRate: 0, demoConversionRate: 0 },
      tasks: [],
      campaignsEnabled: false,
      customerSuccessEnabled: false,
    };
    workspaces.set(msa.id, empty);
    return empty;
  }

  const workspace = rememberWorkspace(buildWorkspace(msa));
  return workspace;
}

export function initializePgAcquisitionFromActivation(
  msaId: string,
  payload: MarketActivationPayload,
  opportunityScore = 55,
): PgAcquisitionWorkspace {
  const pgId = `${msaId}-pg-activated-0`;
  const pg: PgAcquisitionRecord = {
    id: pgId,
    name: payload.physicianGroup.pgName,
    specialty: payload.physicianGroup.specialty,
    stage: "onboarding",
    pipelineValue: Math.round(payload.physicianGroup.estimatedMonthlyReferralVolume * 390 * 12),
    daysInStage: 1,
    referralVolume: payload.physicianGroup.estimatedMonthlyReferralVolume,
    opportunityScore: Math.round(opportunityScore),
    introductionScore: 40,
    hhaOverlapCount: payload.hhaRelationships.length,
    primaryContact: payload.physicianGroup.primaryContactName,
    createdAt: new Date().toISOString(),
  };

  const agencies: HhaAgencyLink[] = payload.hhaRelationships.map((rel, index) => ({
    id: rel.hhaId || `${msaId}-hha-${index}`,
    name: rel.hhaName,
    relationshipStrength: rel.relationshipStrength,
    linkedPgIds: [pgId],
    referralInfluence:
      rel.relationshipStrength === "Strong" ? 72 : rel.relationshipStrength === "Moderate" ? 48 : 24,
    notes: rel.notes,
  }));

  const workspace: PgAcquisitionWorkspace = {
    msaId,
    pgs: [pg],
    agencies,
    campaigns: { activeCampaigns: 0, openRate: 0, meetingConversionRate: 0, demoConversionRate: 0 },
    tasks: [
      {
        id: "onboarding-kickoff",
        label: `Complete onboarding for ${pg.name}`,
        dueLabel: "Due in 3 days",
        kind: "follow-up",
      },
    ],
    campaignsEnabled: true,
    customerSuccessEnabled: false,
  };

  return rememberWorkspace(workspace);
}

export function searchMockHhas(query: string, state: string, limit = 8): HhaAgencyLink[] {
  const normalized = query.trim().toLowerCase();
  const seed = hashSeed(state);
  const results = Array.from({ length: 12 }, (_, index) => {
    const itemSeed = hashSeed(`${state}-${index}`);
    return {
      id: `search-hha-${state}-${index}`,
      name: `${HHA_NAME_PREFIXES[(seed + index) % HHA_NAME_PREFIXES.length]} (${state})`,
      relationshipStrength: "Unknown" as const,
      linkedPgIds: [] as string[],
      referralInfluence: 10 + (itemSeed % 40),
    };
  });

  if (!normalized) return results.slice(0, limit);
  return results.filter((item) => item.name.toLowerCase().includes(normalized)).slice(0, limit);
}

export function getFunnelMetrics(workspace: PgAcquisitionWorkspace) {
  return PG_ACQUISITION_STAGES.map((stage) => {
    const stagePgs = workspace.pgs.filter((pg) => pg.stage === stage.id);
    const pipelineValue = stagePgs.reduce((sum, pg) => sum + pg.pipelineValue, 0);
    const avgDays =
      stagePgs.length > 0
        ? Math.round(stagePgs.reduce((sum, pg) => sum + pg.daysInStage, 0) / stagePgs.length)
        : 0;
    return {
      ...stage,
      count: stagePgs.length,
      pipelineValue,
      avgDaysInStage: avgDays,
    };
  });
}

export function getPipelineKpis(workspace: PgAcquisitionWorkspace) {
  const total = workspace.pgs.length;
  const activeOpps = workspace.pgs.filter(
    (pg) => !["active", "expansion", "identified"].includes(pg.stage),
  ).length;
  const won = workspace.pgs.filter((pg) => ["active", "expansion", "onboarding"].includes(pg.stage)).length;
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
  const avgCycle =
    total > 0 ? Math.round(workspace.pgs.reduce((sum, pg) => sum + pg.daysInStage, 0) / total) : 0;

  const stageCounts = getFunnelMetrics(workspace);
  const conversions = stageCounts.slice(1).map((stage, index) => {
    const prev = stageCounts[index];
    const rate = prev.count > 0 ? Math.round((stage.count / prev.count) * 100) : 0;
    return { from: prev.label, to: stage.label, rate };
  });

  return { total, activeOpps, winRate, avgCycle, conversions };
}

export function getHotOpportunities(workspace: PgAcquisitionWorkspace) {
  return [...workspace.pgs]
    .filter((pg) => !["active", "expansion", "onboarding"].includes(pg.stage))
    .sort(
      (a, b) =>
        b.opportunityScore * 0.4 +
        b.referralVolume * 0.3 +
        b.introductionScore * 0.2 +
        b.hhaOverlapCount * 10 -
        (a.opportunityScore * 0.4 +
          a.referralVolume * 0.3 +
          a.introductionScore * 0.2 +
          a.hhaOverlapCount * 10),
    )
    .slice(0, 5);
}
