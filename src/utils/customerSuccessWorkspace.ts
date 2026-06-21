import type { MSA } from "@/types/msa";
import type { PgAcquisitionRecord } from "@/types/pgAcquisition";
import type {
  AccountLifecycleStage,
  AccountStatus,
  CsAccountHeader,
  CustomerSuccessWorkspace,
  PersonaCategory,
  RelationshipStrength,
} from "@/types/customerSuccess";
import { getPgAcquisitionWorkspace } from "@/utils/pgAcquisitionStore";
import { hashSeed } from "@/utils/marketCalculations";
import { isMsaActivated } from "@/utils/msaActivation";
import { daysSinceActivation } from "@/utils/msaDemoProfiles";
import { isDemoMode, isProductionMode } from "@/utils/appEnvironment";
import { resolveCustomerSuccessPgs } from "@/utils/customerSuccessDemoSeed";

const CSM_NAMES = ["Jordan Lee", "Avery Chen", "Morgan Patel", "Riley Brooks"];

function generateMonthlySeries(seed: string, base: number, growth: number, months = 8): number[] {
  const values: number[] = [];
  let current = base;
  for (let i = 0; i < months; i += 1) {
    const s = hashSeed(`${seed}-${i}`);
    current = Math.round(current * (1 + growth + ((s % 7) - 3) * 0.008));
    values.push(current);
  }
  return values;
}

function resolveLifecycle(pg: PgAcquisitionRecord, msa: MSA): AccountLifecycleStage {
  if (pg.stage === "onboarding") return "onboarding";
  if (pg.stage === "expansion") return "expanding";
  if (pg.stage === "active" && msa.status === "growing" && msa.healthScore >= 80) return "strategic";
  if (pg.stage === "active" && daysSinceActivation(msa) < 90) return "stabilizing";
  if (pg.stage === "active") return "healthy";
  return "onboarding";
}

function resolveAccountStatus(msa: MSA, healthScore: number): AccountStatus {
  if (msa.status === "attention-required" || healthScore < 55) return "at-risk";
  if (msa.status === "opportunity" || healthScore < 75) return "watchlist";
  return "healthy";
}

function csEligiblePgs(msa: MSA): PgAcquisitionRecord[] {
  if (!isMsaActivated(msa)) return [];
  const workspace = getPgAcquisitionWorkspace(msa);
  return resolveCustomerSuccessPgs(msa, workspace.pgs);
}

function buildAccountHeader(
  pg: PgAcquisitionRecord,
  msa: MSA,
  healthScore: number,
): CsAccountHeader {
  const seed = hashSeed(pg.id);
  const lifecycle = resolveLifecycle(pg, msa);
  const renewal = new Date(Date.now() + (180 + (seed % 120)) * 86_400_000);

  return {
    pgId: pg.id,
    pgName: pg.name,
    msaName: msa.name,
    accountOwner: pg.primaryContact ?? "Practice Administrator",
    csmName: CSM_NAMES[seed % CSM_NAMES.length],
    accountStatus: resolveAccountStatus(msa, healthScore),
    lifecycleStage: lifecycle,
    renewalDate: renewal.toISOString().slice(0, 10),
  };
}

function lifecycleGates(
  stage: AccountLifecycleStage,
  demoFullData: boolean,
): CustomerSuccessWorkspace["gates"] {
  if (demoFullData) {
    return {
      valueFulfilment: { available: true },
      valueCommunication: { available: true },
      rapport: { available: true },
      expansion: { available: true },
      tickets: { available: true },
    };
  }

  const onboarding = stage === "onboarding";
  const early = onboarding || stage === "stabilizing";

  return {
    valueFulfilment: onboarding
      ? { available: false, message: "Billing metrics populate after initial claims processing begins." }
      : { available: true },
    valueCommunication: early
      ? { available: false, message: "QBRs begin after the first 30 days of platform use." }
      : { available: true },
    rapport: onboarding
      ? { available: false, message: "Rapport score will improve as stakeholder interactions increase." }
      : { available: true },
    expansion: early
      ? { available: false, message: "Expansion opportunities unlock after account stabilization." }
      : { available: true },
    tickets: { available: true },
  };
}

function buildWorkspaceForPg(pg: PgAcquisitionRecord, msa: MSA): CustomerSuccessWorkspace {
  const seed = hashSeed(`${msa.id}-${pg.id}`);
  const lifecycle = resolveLifecycle(pg, msa);
  const demoFullData = isDemoMode();
  const gates = lifecycleGates(lifecycle, demoFullData);
  const isEarly = !demoFullData && (lifecycle === "onboarding" || lifecycle === "stabilizing");
  const isStrategic = lifecycle === "strategic" || lifecycle === "expanding";
  const isStruggling = msa.status === "attention-required";

  const valueScore = isEarly ? 42 + (seed % 18) : isStruggling ? 52 + (seed % 15) : 68 + (seed % 25);
  const rapportScore = isEarly ? 38 + (seed % 20) : isStruggling ? 45 + (seed % 18) : 62 + (seed % 28);
  const adoption = isEarly ? 35 + (seed % 25) : isStruggling ? 48 + (seed % 20) : 72 + (seed % 20);
  const supportExp = isStruggling ? 58 + (seed % 12) : 78 + (seed % 18);
  const expansionReady = isStrategic ? 75 + (seed % 20) : isEarly ? 28 + (seed % 15) : isStruggling ? 40 + (seed % 15) : 55 + (seed % 25);
  const commScore = gates.valueCommunication.available
    ? isStruggling
      ? 52 + (seed % 15)
      : 70 + (seed % 22)
    : 40 + (seed % 15);

  const healthBreakdown = {
    valueFulfilment: gates.valueFulfilment.available ? valueScore : 0,
    valueCommunication: gates.valueCommunication.available ? commScore : 0,
    rapport: gates.rapport.available ? rapportScore : 0,
    adoption,
    supportExperience: supportExp,
    expansionReadiness: gates.expansion.available ? expansionReady : 0,
  };

  const accountHealthScore = Math.round(
    healthBreakdown.valueFulfilment * 0.22 +
      healthBreakdown.valueCommunication * 0.14 +
      healthBreakdown.rapport * 0.18 +
      healthBreakdown.adoption * 0.12 +
      healthBreakdown.supportExperience * 0.14 +
      healthBreakdown.expansionReadiness * 0.1 +
      (100 - msa.churnRate * 3) * 0.1,
  );

  const header = buildAccountHeader(pg, msa, accountHealthScore);
  const monthlyRevenue = Math.round(pg.pipelineValue / 12);
  const claimsBase = Math.round(pg.referralVolume * 8 + seed % 40);

  const alerts: CustomerSuccessWorkspace["alerts"] = [];
  if (msa.status === "attention-required") {
    alerts.push({ id: "sla", message: "SLA breached for 3 tickets", sentiment: "risk" });
    alerts.push({ id: "cfo", message: "CFO engagement dropped", sentiment: "warning" });
  } else if (isStrategic) {
    alerts.push({ id: "rpm", message: "RPM opportunity identified", sentiment: "positive" });
  }
  if (!gates.valueCommunication.available) {
    alerts.push({ id: "qbr", message: "QBR scheduling begins after first 30 days", sentiment: "warning" });
  } else if (seed % 3 === 0) {
    alerts.push({ id: "qbr-overdue", message: "QBR overdue by 12 days", sentiment: "warning" });
  }
  if (seed % 4 === 0) {
    alerts.push({ id: "billing", message: "Billing turnaround increased 18%", sentiment: "warning" });
  }
  if (seed % 5 === 0) {
    alerts.push({ id: "champion", message: "Champion changed roles", sentiment: "risk" });
  }
  if (alerts.length < 2) {
    alerts.push({ id: "positive", message: "Claims acceptance rate improved 4%", sentiment: "positive" });
  }

  const denialRate = isStruggling ? 14 + (seed % 8) : 8 + (seed % 6);
  const claimsAcceptance = isStruggling ? 78 + (seed % 8) : 88 + (seed % 10);

  const personaNodes: CustomerSuccessWorkspace["accountMap"]["nodes"] = [
    { id: "pg", name: pg.name, role: "Physician Group", category: "clinical" as PersonaCategory, influenceScore: 100, sentimentScore: isStruggling ? 58 : 72, relationshipStrength: "strong" as RelationshipStrength },
    { id: "md", name: "Dr. Sarah Kim", role: "Medical Director", category: "clinical" as PersonaCategory, influenceScore: 88, sentimentScore: isStruggling ? 52 + (seed % 15) : 70 + (seed % 20), relationshipStrength: (isStruggling ? "moderate" : seed % 2 === 0 ? "strong" : "moderate") as RelationshipStrength },
    { id: "pm", name: "Lisa Nguyen", role: "Practice Manager", category: "operations" as PersonaCategory, influenceScore: 82, sentimentScore: isStruggling ? 60 + (seed % 12) : 65 + (seed % 25), relationshipStrength: (isStruggling ? "moderate" : "strong") as RelationshipStrength },
    { id: "bm", name: demoFullData || !isEarly ? "David Ortiz" : "", role: "Billing Manager", category: "financial" as PersonaCategory, influenceScore: isEarly && !demoFullData ? 0 : isStruggling ? 58 : 76, sentimentScore: isEarly && !demoFullData ? 0 : isStruggling ? 48 : 68, relationshipStrength: (isStruggling || isEarly ? "weak" : "moderate") as RelationshipStrength },
    { id: "ops", name: "Taylor Reed", role: "Operations Lead", category: "operations" as PersonaCategory, influenceScore: 70, sentimentScore: isStruggling ? 55 : 68, relationshipStrength: "moderate" as RelationshipStrength },
    { id: "cfo", name: demoFullData ? (isStruggling ? "Patricia Cole" : "James Walsh") : isStruggling ? "" : "James Walsh", role: isStruggling ? "CFO" : "Executive Sponsor", category: "executive" as PersonaCategory, influenceScore: isStruggling && !demoFullData ? 0 : isStruggling ? 62 : 90, sentimentScore: isStruggling ? 42 : 60, relationshipStrength: (isStruggling ? "weak" : "moderate") as RelationshipStrength },
    { id: "it", name: "Alex Rivera", role: "EHR Administrator", category: "technical" as PersonaCategory, influenceScore: 55, sentimentScore: 72, relationshipStrength: "moderate" as RelationshipStrength },
  ].filter((n) => n.name || n.id === "pg");

  const personaMatrix: CustomerSuccessWorkspace["personaMatrix"] = [
    { persona: "Medical Director", owner: header.csmName, influence: 88, engagementFrequency: "Bi-weekly", sentiment: isStruggling ? 62 : 74, lastInteraction: isStruggling ? "18 days ago" : "3 days ago", riskLevel: isStruggling ? "medium" : "low" },
    { persona: "Practice Manager", owner: header.csmName, influence: 82, engagementFrequency: "Weekly", sentiment: isStruggling ? 68 : 78, lastInteraction: isStruggling ? "8 days ago" : "Yesterday", riskLevel: "low" },
    { persona: "Billing Manager", owner: header.csmName, influence: isEarly && !demoFullData ? 0 : isStruggling ? 58 : 76, engagementFrequency: isEarly && !demoFullData ? "—" : "Monthly", sentiment: isEarly && !demoFullData ? 0 : isStruggling ? 48 : 65, lastInteraction: isEarly && !demoFullData ? "—" : isStruggling ? "32 days ago" : "12 days ago", riskLevel: isStruggling || isEarly ? "high" : "medium", missing: isEarly && !demoFullData },
    { persona: "Operations Lead", owner: header.csmName, influence: 70, engagementFrequency: "Bi-weekly", sentiment: isStruggling ? 55 : 70, lastInteraction: isStruggling ? "21 days ago" : "5 days ago", riskLevel: isStruggling ? "medium" : "low" },
    { persona: "Executive Sponsor", owner: header.csmName, influence: isStruggling && !demoFullData ? 0 : isStruggling ? 62 : 92, engagementFrequency: isStruggling ? "Quarterly" : "Quarterly", sentiment: isStruggling ? 42 : 58, lastInteraction: isStruggling ? "67 days ago" : "45 days ago", riskLevel: "high", missing: isStruggling && !demoFullData },
  ];

  return {
    accounts: [],
    selectedPgId: pg.id,
    header,
    topKpis: {
      accountHealthScore,
      previousHealthScore: accountHealthScore - (msa.status === "growing" ? 3 : -4),
      arr: monthlyRevenue * 12,
      monthlyRevenue,
      valueScore,
      rapportScore: gates.rapport.available ? rapportScore : 0,
      nps: isEarly ? 32 + (seed % 15) : 48 + (seed % 40),
    },
    healthBreakdown,
    overviewMetrics: {
      monthlyRecurringRevenue: monthlyRevenue,
      claimsProcessed: gates.valueFulfilment.available ? claimsBase : 0,
      claimsAcceptanceRate: gates.valueFulfilment.available ? claimsAcceptance : 0,
      billingTurnaroundDays: gates.valueFulfilment.available ? (isStruggling ? 8 + (seed % 4) : 4 + (seed % 5)) : 0,
      averageResponseTimeHours: isStruggling ? 6 + (seed % 10) : 2 + (seed % 8),
      activeUsers: isEarly ? 3 + (seed % 4) : 8 + (seed % 12),
      openTickets: isStruggling ? 5 + (seed % 4) : 1 + (seed % 3),
      expansionOpportunities: gates.expansion.available ? (isStruggling ? 1 + (seed % 2) : 2 + (seed % 4)) : 0,
    },
    alerts,
    billing: {
      claimsSubmitted: claimsBase,
      claimsApproved: Math.round(claimsBase * (claimsAcceptance / 100)),
      claimsDenied: Math.round(claimsBase * (1 - claimsAcceptance / 100)),
      denialRate: gates.valueFulfilment.available ? denialRate : 0,
      avgReimbursementDays: 12 + (seed % 8),
      revenueGenerated: monthlyRevenue * 3,
      revenueCaptured: Math.round(monthlyRevenue * 2.7),
      revenueMissed: Math.round(monthlyRevenue * 0.3),
      monthlyClaimsTrend: generateMonthlySeries(`${pg.id}-claims`, claimsBase, 0.04),
      monthlyRevenueTrend: generateMonthlySeries(`${pg.id}-rev`, monthlyRevenue, 0.03),
      denialsByReason: [
        { reason: "Documentation", count: 12 + (seed % 8) },
        { reason: "Eligibility", count: 8 + (seed % 6) },
        { reason: "Coding", count: 5 + (seed % 5) },
      ],
    },
    codePerformance: [
      { code: "G0179", label: "G0179", volume: 40 + (seed % 30), revenue: 18_000 + seed % 8000, growthRate: 6 + (seed % 8) },
      { code: "G0180", label: "G0180", volume: 55 + (seed % 40), revenue: 24_000 + seed % 10000, growthRate: 4 + (seed % 6) },
      { code: "G0181", label: "G0181", volume: 30 + (seed % 25), revenue: 14_000 + seed % 6000, growthRate: 8 + (seed % 5) },
      { code: "G0182", label: "G0182", volume: 22 + (seed % 18), revenue: 11_000 + seed % 5000, growthRate: 6 + (seed % 4) },
      { code: "RPM", label: "RPM", volume: isStrategic || demoFullData ? 20 + (seed % 15) : 2, revenue: isStrategic || demoFullData ? 12_000 + (seed % 5000) : 800, growthRate: isStrategic || demoFullData ? 22 : 0 },
      { code: "CCM", label: "CCM", volume: 25 + (seed % 20), revenue: 10_000 + seed % 5000, growthRate: 5 + (seed % 7) },
      { code: "CPO", label: "CPO", volume: isStrategic || demoFullData ? 15 + (seed % 10) : 0, revenue: isStrategic || demoFullData ? 9000 + (seed % 4000) : 0, growthRate: isStrategic || demoFullData ? 18 : 0 },
    ],
    hhahCoordination: {
      activeHhahs: pg.hhaOverlapCount || 2,
      ordersProcessed: 120 + (seed % 80),
      avgOrderTurnaroundDays: 2 + (seed % 3),
      documentationCompletionRate: 88 + (seed % 10),
      escalationRate: msa.status === "attention-required" ? 8 : 3 + (seed % 4),
    },
    valueSummary: {
      revenueGenerated: monthlyRevenue * 3,
      hoursSaved: 120 + (seed % 60),
      adminBurdenReducedPct: 18 + (seed % 12),
      billingCycleImprovementDays: 5 + (seed % 4),
      denialReductionPct: 12 + (seed % 8),
      estimatedQuarterlyValue: monthlyRevenue * 3.2,
    },
    reviewCadence: [
      { type: "WBR", lastDate: demoFullData || !isEarly ? "2026-06-10" : null, nextDate: "2026-06-17", attendanceRate: isStruggling ? 68 : 85, status: isEarly && !demoFullData ? "upcoming" : "on-track" },
      { type: "MBR", lastDate: demoFullData || !isEarly ? "2026-05-28" : null, nextDate: "2026-06-28", attendanceRate: isStruggling ? 62 : 78, status: isEarly && !demoFullData ? "upcoming" : "on-track" },
      { type: "QBR", lastDate: gates.valueCommunication.available ? (isStruggling ? "2025-12-10" : "2026-03-15") : null, nextDate: gates.valueCommunication.available ? "2026-06-30" : null, attendanceRate: gates.valueCommunication.available ? (isStruggling ? 58 : 72) : 0, status: gates.valueCommunication.available ? (isStruggling || seed % 3 === 0 ? "overdue" : "scheduled") : "upcoming" },
    ],
    meetingEffectiveness: gates.valueCommunication.available
      ? [
          {
            reviewType: "QBR",
            date: isStruggling ? "2025-12-10" : "2026-03-15",
            participants: ["Medical Director", "Practice Manager", "Billing Lead", header.csmName],
            topicsCovered: isStruggling
              ? ["SLA recovery plan", "Denial root causes", "Escalation backlog"]
              : ["Claims performance", "Denial trends", "HHAH coordination", "Q2 goals"],
            actionItems: isStruggling ? 7 : 5,
            followUpCompletionRate: isStruggling ? 43 : 80,
          },
          {
            reviewType: "MBR",
            date: "2026-05-28",
            participants: ["Practice Manager", "Operations Lead", header.csmName],
            topicsCovered: ["Monthly claims volume", "SLA review", "Training needs"],
            actionItems: 3,
            followUpCompletionRate: isStruggling ? 50 : 67,
          },
          {
            reviewType: "WBR",
            date: "2026-06-10",
            participants: ["Practice Manager", "Billing Lead", header.csmName],
            topicsCovered: ["Weekly claims throughput", "Open ticket review"],
            actionItems: 2,
            followUpCompletionRate: isStruggling ? 55 : 90,
          },
        ]
      : [],
    executiveEngagement: gates.valueCommunication.available
      ? [
          { role: "Medical Director", meetingsAttended: isStruggling ? 2 : 4, responseRate: isStruggling ? 58 : 82, lastInteraction: isStruggling ? "18 days ago" : "3 days ago" },
          { role: "Practice Manager", meetingsAttended: isStruggling ? 4 : 6, responseRate: isStruggling ? 72 : 90, lastInteraction: isStruggling ? "8 days ago" : "Yesterday" },
          { role: "Billing Lead", meetingsAttended: isStruggling ? 1 : 2, responseRate: isStruggling ? 45 : 65, lastInteraction: isStruggling ? "32 days ago" : "12 days ago" },
          { role: "Operations Lead", meetingsAttended: isStruggling ? 2 : 3, responseRate: isStruggling ? 55 : 75, lastInteraction: isStruggling ? "21 days ago" : "5 days ago" },
          { role: "Executive Sponsor", meetingsAttended: isStruggling ? 0 : 2, responseRate: isStruggling ? 28 : 52, lastInteraction: isStruggling ? "67 days ago" : "45 days ago" },
        ]
      : [],
    communicationHealthScore: commScore,
    rapportScore: gates.rapport.available ? rapportScore : 0,
    accountMap: {
      nodes: personaNodes,
      links: personaNodes.filter((n) => n.id !== "pg").map((n) => ({
        from: "pg",
        to: n.id,
        strength: n.relationshipStrength,
      })),
    },
    personaMatrix,
    championTracker: {
      primaryChampion: "Lisa Nguyen, Practice Manager",
      executiveSponsor: msa.status === "attention-required" ? null : "James Walsh, CFO",
      detractors: msa.status === "attention-required" ? ["Billing team contact"] : [],
      neutralStakeholders: ["EHR Administrator"],
      strengthScore: rapportScore,
      riskScore: msa.status === "attention-required" ? 68 : 22 + (seed % 20),
      alerts: [
        ...(msa.status === "attention-required" ? ["Executive sponsor missing", "Single-threaded account risk"] : []),
        ...(seed % 4 === 0 ? ["Champion inactive for 45 days"] : []),
      ],
    },
    expansionOpportunities: gates.expansion.available
      ? [
          { id: "exp-rpm", label: "RPM program expansion", stage: "Discussing", value: 84000, probability: 55, expectedCloseDate: "2026-08-15" },
          { id: "exp-ccm", label: "CCM scale-up", stage: "Qualified", value: 52000, probability: 40, expectedCloseDate: "2026-09-01" },
          { id: "exp-cpo", label: "CPO services", stage: "Proposal sent", value: 45000, probability: 60, expectedCloseDate: "2026-07-20" },
          { id: "exp-hha", label: "Additional HHAH coverage", stage: "Identified", value: 36000, probability: 25, expectedCloseDate: "2026-10-01" },
          { id: "exp-loc", label: "New location rollout", stage: "Negotiating", value: 68000, probability: 70, expectedCloseDate: "2026-07-01" },
          { id: "exp-phys", label: "Additional physicians", stage: "Won", value: 28000, probability: 100, expectedCloseDate: "2026-05-15" },
        ]
      : [],
    crossSellRecommendations: gates.expansion.available
      ? [
          { id: "cs-rpm", title: "High RPM eligibility", description: "42 patients meet RPM criteria based on chronic conditions.", estimatedRevenue: 72000 },
          { id: "cs-ccm", title: "CCM candidate population", description: "28 patients eligible for CCM enrollment.", estimatedRevenue: 48000 },
          { id: "cs-hha", title: "HHAH coverage gaps", description: "2 counties with untapped referral pathways.", estimatedRevenue: 31000 },
        ]
      : [],
    ticketKpis: {
      openTickets: msa.status === "attention-required" ? 7 : 2 + (seed % 3),
      closedTickets: 24 + (seed % 20),
      slaAdherence: msa.status === "attention-required" ? 82 : 92 + (seed % 6),
      avgResolutionHours: msa.status === "attention-required" ? 28 : 14 + (seed % 10),
      escalationRate: msa.status === "attention-required" ? 12 : 4 + (seed % 4),
      csat: 4.2 + (seed % 8) / 10,
      monthlyTrend: generateMonthlySeries(`${pg.id}-tickets`, 8, -0.02),
    },
    supportCategories: [
      { category: "Billing", volume: 18 + (seed % 10), resolutionHours: 16, satisfaction: 4.1 },
      { category: "Claims", volume: 14 + (seed % 8), resolutionHours: 12, satisfaction: 4.3 },
      { category: "EHR", volume: 8 + (seed % 6), resolutionHours: 20, satisfaction: 3.9 },
      { category: "Documentation", volume: 10 + (seed % 5), resolutionHours: 10, satisfaction: 4.4 },
      { category: "HHAH coordination", volume: 6 + (seed % 4), resolutionHours: 8, satisfaction: 4.5 },
    ],
    actions: [
      { id: "a1", action: gates.valueCommunication.available ? "Schedule QBR" : "Complete onboarding kickoff", priority: "high", owner: header.csmName, expectedImpact: "Strengthen executive alignment", dueDate: "2026-06-20" },
      { id: "a2", action: msa.status === "attention-required" ? "Re-engage CFO" : "Introduce RPM offering", priority: "high", owner: header.csmName, expectedImpact: gates.expansion.available ? "$72K expansion pipeline" : "Reduce account risk", dueDate: "2026-06-25" },
      { id: "a3", action: "Resolve SLA breach", priority: msa.status === "attention-required" ? "high" : "medium", owner: "Support Lead", expectedImpact: "Improve support experience score", dueDate: "2026-06-18" },
      { id: "a4", action: "Train billing team", priority: "medium", owner: header.csmName, expectedImpact: "Reduce denial rate 3%", dueDate: "2026-07-01" },
      { id: "a5", action: "Add executive sponsor", priority: personaMatrix.some((p) => p.missing) ? "high" : "low", owner: header.csmName, expectedImpact: "Multi-thread account relationships", dueDate: "2026-06-30" },
    ],
    gates,
  };
}

export function buildCustomerSuccessWorkspace(
  msa: MSA,
  selectedPgId?: string,
): CustomerSuccessWorkspace | null {
  let pgs = csEligiblePgs(msa);
  if (pgs.length === 0 && isDemoMode() && isMsaActivated(msa)) {
    pgs = resolveCustomerSuccessPgs(msa, []);
  }
  if (pgs.length === 0) return null;

  const accounts = pgs.map((pg) => {
    const ws = buildWorkspaceForPg(pg, msa);
    return ws.header;
  });

  const selected =
    pgs.find((pg) => pg.id === selectedPgId) ??
    pgs.find((pg) => pg.stage === "active" || pg.stage === "expansion") ??
    pgs[0];

  const workspace = buildWorkspaceForPg(selected, msa);
  workspace.accounts = accounts;
  return workspace;
}

export function getCustomerSuccessEmptyState(msa: MSA): { title: string; message: string } | null {
  if (!isMsaActivated(msa)) {
    return {
      title: "Market not activated",
      message: "Customer Success begins after a market is activated and a physician group is onboarded.",
    };
  }

  if (!isProductionMode()) {
    return null;
  }

  return {
    title: "Awaiting first onboarded PG",
    message:
      "Customer Success dashboards launch after a physician group completes onboarding onto the platform.",
  };
}
