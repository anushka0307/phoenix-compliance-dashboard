import type { MsaBase } from "@/types/msa";
import type { MsaDemoProfile, MsaDemoTier } from "@/types/msaClassification";
import { hashSeed } from "@/utils/marketCalculations";

const GROWING_PROFILES: Record<string, Partial<MsaDemoProfile>> = {
  "los-angeles-ca": { referralCoveragePct: 62, revenueGrowthYoy: 12.4, opportunityScoreTarget: 84 },
  "dallas-tx": { referralCoveragePct: 58, revenueGrowthYoy: 11.1, opportunityScoreTarget: 82 },
  "boston-ma": { referralCoveragePct: 56, revenueGrowthYoy: 10.6, opportunityScoreTarget: 80 },
  "indianapolis-in": { referralCoveragePct: 54, revenueGrowthYoy: 9.8, opportunityScoreTarget: 78 },
  "orlando-fl": { referralCoveragePct: 55, revenueGrowthYoy: 10.2, opportunityScoreTarget: 79 },
  "atlanta-ga": { referralCoveragePct: 58, revenueGrowthYoy: 11.2, opportunityScoreTarget: 81 },
  "houston-tx": { referralCoveragePct: 57, revenueGrowthYoy: 10.8, opportunityScoreTarget: 80 },
  "denver-co": { referralCoveragePct: 53, revenueGrowthYoy: 9.4, opportunityScoreTarget: 77 },
  "austin-tx": { referralCoveragePct: 52, revenueGrowthYoy: 8.9, opportunityScoreTarget: 76 },
  "colorado-springs-co": { referralCoveragePct: 51, revenueGrowthYoy: 8.2, opportunityScoreTarget: 75 },
  "san-antonio-tx": { referralCoveragePct: 50, revenueGrowthYoy: 8.6, opportunityScoreTarget: 75 },
};

const OPPORTUNITY_PROFILES: Record<string, Partial<MsaDemoProfile>> = {
  "las-vegas-nv": { referralCoveragePct: 42, revenueGrowthYoy: 4.8, opportunityScoreTarget: 68 },
  "nashville-tn": { referralCoveragePct: 38, revenueGrowthYoy: 3.6, opportunityScoreTarget: 64 },
  "clarksville-tn-ky": { referralCoveragePct: 36, revenueGrowthYoy: 2.8, opportunityScoreTarget: 58 },
  "port-st-lucie-fl": { referralCoveragePct: 34, revenueGrowthYoy: 2.4, opportunityScoreTarget: 56 },
  "oklahoma-city-ok": { referralCoveragePct: 40, revenueGrowthYoy: 4.2, opportunityScoreTarget: 66 },
  "albuquerque-nm": { referralCoveragePct: 35, revenueGrowthYoy: 1.8, opportunityScoreTarget: 62 },
  "bristol-tn-va": { referralCoveragePct: 37, revenueGrowthYoy: 3.1, opportunityScoreTarget: 60 },
  "springfield-ma": { referralCoveragePct: 39, revenueGrowthYoy: 3.8, opportunityScoreTarget: 63 },
};

const ATTENTION_PROFILES: Record<string, Partial<MsaDemoProfile>> = {
  "miami-fl": { referralCoveragePct: 22, revenueGrowthYoy: -6.4, opportunityScoreTarget: 44 },
  "phoenix-az": { referralCoveragePct: 20, revenueGrowthYoy: -5.8, opportunityScoreTarget: 46 },
  "charlotte-nc": { referralCoveragePct: 18, revenueGrowthYoy: -4.2, opportunityScoreTarget: 42 },
  "detroit-mi": { referralCoveragePct: 17, revenueGrowthYoy: -7.1, opportunityScoreTarget: 38 },
  "worcester-ma": { referralCoveragePct: 16, revenueGrowthYoy: -3.6, opportunityScoreTarget: 40 },
};

const NEW_MARKET_PROFILES: Record<string, Partial<MsaDemoProfile>> = {
  "wichita-falls-tx": {
    referralCoveragePct: 24,
    revenueGrowthYoy: 0.8,
    opportunityScoreTarget: 48,
    classificationReady: false,
  },
};

function defaultProfileForTier(tier: MsaDemoTier, msaId: string): MsaDemoProfile {
  const hash = hashSeed(msaId);

  if (tier === "growing") {
    return {
      tier,
      referralCoveragePct: 52 + (hash % 14),
      revenueGrowthYoy: 8 + (hash % 6),
      patientGrowthYoy: 5 + (hash % 5),
      referralVolumeGrowthYoy: 7 + (hash % 5),
      opportunityScoreTarget: 75 + (hash % 10),
      classificationReady: true,
      concentrationRiskPct: 28 + (hash % 12),
    };
  }

  if (tier === "opportunity") {
    return {
      tier,
      referralCoveragePct: 32 + (hash % 14),
      revenueGrowthYoy: 2 + (hash % 5),
      patientGrowthYoy: 1 + (hash % 4),
      referralVolumeGrowthYoy: 1.5 + (hash % 4),
      opportunityScoreTarget: 55 + (hash % 18),
      classificationReady: true,
      concentrationRiskPct: 32 + (hash % 10),
    };
  }

  if (tier === "attention") {
    return {
      tier,
      referralCoveragePct: 15 + (hash % 10),
      revenueGrowthYoy: -7 + (hash % 5),
      patientGrowthYoy: -3 - (hash % 3),
      referralVolumeGrowthYoy: -5 - (hash % 4),
      opportunityScoreTarget: 35 + (hash % 14),
      classificationReady: true,
      concentrationRiskPct: 46 + (hash % 12),
    };
  }

  return {
    tier: "new-market",
    referralCoveragePct: 20 + (hash % 8),
    revenueGrowthYoy: 0.5 + (hash % 2),
    patientGrowthYoy: 0.2,
    referralVolumeGrowthYoy: 0.4,
    opportunityScoreTarget: 50 + (hash % 8),
    classificationReady: false,
    concentrationRiskPct: 30 + (hash % 8),
  };
}

export function resolveMsaDemoProfile(msa: MsaBase): MsaDemoProfile {
  if (msa.demoProfile) {
    return {
      ...defaultProfileForTier(msa.demoProfile.tier, msa.id),
      ...msa.demoProfile,
    };
  }

  const overrides =
    GROWING_PROFILES[msa.id] ??
    OPPORTUNITY_PROFILES[msa.id] ??
    ATTENTION_PROFILES[msa.id] ??
    NEW_MARKET_PROFILES[msa.id];

  const tier =
    overrides === NEW_MARKET_PROFILES[msa.id]
      ? "new-market"
      : GROWING_PROFILES[msa.id]
        ? "growing"
        : OPPORTUNITY_PROFILES[msa.id]
          ? "opportunity"
          : ATTENTION_PROFILES[msa.id]
            ? "attention"
            : msa.status === "attention-required"
              ? "attention"
              : msa.status === "opportunity"
                ? "opportunity"
                : "growing";

  return {
    ...defaultProfileForTier(tier, msa.id),
    ...overrides,
    tier,
  };
}

export function applyDemoProfileToMsaBase(msa: MsaBase): MsaBase {
  if (!msa.activatedAt && msa.status === "inactive") {
    return msa;
  }

  const profile = resolveMsaDemoProfile(msa);

  const churnRate =
    profile.tier === "growing"
      ? 2 + (hashSeed(`${msa.id}-churn`) % 20) / 10
      : profile.tier === "opportunity"
        ? 4 + (hashSeed(`${msa.id}-churn`) % 18) / 10
        : profile.tier === "attention"
          ? 8 + (hashSeed(`${msa.id}-churn`) % 35) / 10
          : 5.5;

  const conversionRate =
    profile.tier === "growing"
      ? 26 + (hashSeed(`${msa.id}-conv`) % 65) / 10
      : profile.tier === "opportunity"
        ? 12 + (hashSeed(`${msa.id}-conv`) % 60) / 10
        : profile.tier === "attention"
          ? 6 + (hashSeed(`${msa.id}-conv`) % 42) / 10
          : 11;

  const onboardingDays =
    profile.tier === "growing"
      ? Math.min(22, msa.onboardingDays || 18)
      : profile.tier === "opportunity"
        ? 30 + (hashSeed(`${msa.id}-onb`) % 22)
        : profile.tier === "attention"
          ? Math.max(0, msa.onboardingDays)
          : 14 + (hashSeed(`${msa.id}-onb`) % 10);

  const physicianGroups = Math.max(
    profile.tier === "new-market" ? 1 : 2,
    msa.operationalMetrics?.physicianGroups ?? 0,
  );

  return {
    ...msa,
    demoProfile: profile,
    churnRate,
    conversionRate,
    onboardingDays,
    onboardingStatus:
      profile.tier === "new-market" ? "in_progress" : msa.onboardingStatus ?? "complete",
    operationalMetrics: msa.operationalMetrics
      ? { ...msa.operationalMetrics, physicianGroups }
      : undefined,
  };
}

export function estimateReferralVolume(msa: MsaBase): number {
  const pgs = msa.operationalMetrics?.physicianGroups ?? 0;
  return Math.max(100, Math.round(pgs * 52 + (hashSeed(`${msa.id}-referrals`) % 120)));
}

export function daysSinceActivation(msa: MsaBase): number {
  if (!msa.activatedAt) return 0;
  const activated = new Date(msa.activatedAt).getTime();
  return Math.max(0, Math.floor((Date.now() - activated) / (1000 * 60 * 60 * 24)));
}

export function isClassificationReady(msa: MsaBase, profile: MsaDemoProfile): {
  ready: boolean;
  reasons: string[];
} {
  if (profile.tier === "new-market" || profile.classificationReady === false) {
    return {
      ready: false,
      reasons: ["Classification deferred until onboarding and referral baseline is established"],
    };
  }

  const reasons: string[] = [];
  const pgs = msa.operationalMetrics?.physicianGroups ?? 0;

  if (pgs < 1) reasons.push("Fewer than 1 active PG");
  if (daysSinceActivation(msa) < 30) reasons.push("Less than 30 days of operational data");
  if (estimateReferralVolume(msa) < 100) reasons.push("Fewer than 100 referrals recorded");
  if (msa.onboardingStatus !== "complete") {
    reasons.push("No completed onboarding cycle");
  }

  return { ready: reasons.length === 0, reasons };
}
