import type { MSA } from "@/types/msa";
import type { PgAcquisitionRecord, PgAcquisitionStage } from "@/types/pgAcquisition";
import { hashSeed } from "@/utils/marketCalculations";
import { isDemoMode } from "@/utils/appEnvironment";

const DEMO_PG_TEMPLATES = [
  { name: "North Partner Physicians", specialty: "Primary Care", physicians: 18 },
  { name: "East Medical Associates", specialty: "Internal Medicine", physicians: 24 },
  { name: "Central Primary Care", specialty: "Family Medicine", physicians: 14 },
  { name: "West Cardiology Group", specialty: "Cardiology", physicians: 12 },
  { name: "South Family Physicians", specialty: "Primary Care", physicians: 16 },
] as const;

const CONTACT_NAMES = [
  "Dr. Elena Vasquez",
  "Marcus Chen",
  "Priya Sharma",
  "Robert Hayes",
  "Angela Brooks",
];

const CS_ELIGIBLE_STAGES: PgAcquisitionStage[] = ["onboarding", "active", "expansion"];

function onboardedCountRange(msa: MSA): { min: number; max: number } {
  switch (msa.status) {
    case "growing":
      return { min: 4, max: 5 };
    case "opportunity":
      return { min: 2, max: 3 };
    case "attention-required":
      return { min: 1, max: 3 };
    default:
      return { min: 2, max: 4 };
  }
}

function stagesForMsaStatus(msa: MSA, count: number): PgAcquisitionStage[] {
  const seed = hashSeed(`${msa.id}-cs-stages`);
  const stages: PgAcquisitionStage[] = [];

  if (msa.status === "growing") {
    const expansionSlots = Math.min(2, count);
    const activeSlots = Math.max(0, count - expansionSlots - (seed % 2));
    const onboardingSlots = Math.max(0, count - expansionSlots - activeSlots);
    for (let i = 0; i < expansionSlots; i += 1) stages.push("expansion");
    for (let i = 0; i < activeSlots; i += 1) stages.push("active");
    for (let i = 0; i < onboardingSlots; i += 1) stages.push("onboarding");
    while (stages.length < count) stages.push("active");
    return stages;
  }

  if (msa.status === "opportunity") {
    for (let i = 0; i < count; i += 1) {
      stages.push(i === 0 && seed % 2 === 0 ? "onboarding" : "active");
    }
    return stages;
  }

  if (msa.status === "attention-required") {
    for (let i = 0; i < count; i += 1) {
      stages.push(i === 0 ? "onboarding" : seed % 3 === 0 ? "active" : "onboarding");
    }
    return stages;
  }

  for (let i = 0; i < count; i += 1) {
    stages.push(i < count - 1 ? "active" : "onboarding");
  }
  return stages;
}

function buildDemoPg(
  msa: MSA,
  index: number,
  stage: PgAcquisitionStage,
): PgAcquisitionRecord {
  const template = DEMO_PG_TEMPLATES[index % DEMO_PG_TEMPLATES.length];
  const pgSeed = hashSeed(`${msa.id}-cs-demo-pg-${index}`);
  const baseValue = Math.max(140_000, Math.round(msa.revenue / Math.max(msa.physicianGroups, 4)));
  const daysLive = stage === "onboarding" ? 12 + (pgSeed % 20) : 90 + (pgSeed % 240);
  const hhaCount = 3 + (pgSeed % 8);

  const referralBase =
    msa.status === "growing"
      ? 120 + (pgSeed % 100)
      : msa.status === "opportunity"
        ? 70 + (pgSeed % 60)
        : 40 + (pgSeed % 50);

  return {
    id: `${msa.id}-cs-demo-${index}`,
    name: template.name,
    specialty: template.specialty,
    stage,
    pipelineValue: Math.round(baseValue * (0.75 + (pgSeed % 40) / 100)),
    daysInStage: stage === "onboarding" ? 8 + (pgSeed % 25) : 30 + (pgSeed % 90),
    referralVolume: referralBase,
    opportunityScore: 50 + (pgSeed % 45),
    introductionScore: 55 + (pgSeed % 40),
    hhaOverlapCount: hhaCount,
    primaryContact: CONTACT_NAMES[pgSeed % CONTACT_NAMES.length],
    createdAt: new Date(Date.now() - daysLive * 86_400_000).toISOString(),
  };
}

/** Minimum onboarded PG count every active demo MSA should expose to Customer Success. */
export function getTargetOnboardedPgCount(msa: MSA): number {
  const { min, max } = onboardedCountRange(msa);
  const seed = hashSeed(`${msa.id}-cs-count`);
  return min + (seed % (max - min + 1));
}

export function isCustomerSuccessEligibleStage(stage: PgAcquisitionStage): boolean {
  return CS_ELIGIBLE_STAGES.includes(stage);
}

/**
 * Returns CS-eligible PGs, supplementing with demo records when needed.
 * In production, only real onboarded PGs are returned.
 */
export function resolveCustomerSuccessPgs(
  msa: MSA,
  acquisitionPgs: PgAcquisitionRecord[],
): PgAcquisitionRecord[] {
  const eligible = acquisitionPgs.filter((pg) => isCustomerSuccessEligibleStage(pg.stage));

  if (!isDemoMode()) {
    return eligible;
  }

  const target = getTargetOnboardedPgCount(msa);
  if (eligible.length >= target) {
    return eligible;
  }

  const existingIds = new Set(eligible.map((pg) => pg.id));
  const stages = stagesForMsaStatus(msa, target);
  const demoPgs: PgAcquisitionRecord[] = [];

  for (let i = 0; i < target; i += 1) {
    const pg = buildDemoPg(msa, i, stages[i] ?? "active");
    if (!existingIds.has(pg.id)) {
      demoPgs.push(pg);
    }
  }

  const merged = [...eligible];
  for (const pg of demoPgs) {
    if (merged.length >= target) break;
    if (!merged.some((item) => item.id === pg.id)) {
      merged.push(pg);
    }
  }

  while (merged.length < target) {
    const index = merged.length;
    merged.push(buildDemoPg(msa, index, stages[index] ?? "active"));
  }

  return merged.slice(0, Math.max(target, eligible.length));
}

/** Ensures PG acquisition seed data includes enough onboarded PGs for demos. */
export function enrichAcquisitionPgsForDemo(
  msa: MSA,
  pgs: PgAcquisitionRecord[],
): PgAcquisitionRecord[] {
  if (!isDemoMode()) return pgs;

  const onboarded = pgs.filter((pg) => isCustomerSuccessEligibleStage(pg.stage));
  const target = getTargetOnboardedPgCount(msa);
  if (onboarded.length >= target) return pgs;

  const stages = stagesForMsaStatus(msa, target - onboarded.length);
  const supplements = stages.map((stage, index) =>
    buildDemoPg(msa, onboarded.length + index, stage),
  );

  return [...pgs, ...supplements];
}
