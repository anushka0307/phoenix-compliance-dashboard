import type { MSA } from "@/types/msa";
import { getMsaById } from "@/data/mockMsas";
import { getShortMarketName } from "@/utils/msaStatus";
import { formatPercent } from "@/utils/format";
import type { ResolvedDateRange } from "@/utils/dateRangeHelpers";
import { resolveMsaDemoProfile } from "@/utils/msaDemoProfiles";
import { isDemoMode } from "@/utils/appEnvironment";

export interface NetworkKpis {
  revenue: number;
  patients: number;
  physicianGroups: number;
  homeHealthAgencies: number;
  activeMarkets: number;
  avgMarketStrength: number;
  networkHealthScore: number;
  networkHealthTrend: number;
  pgaConversionRate: number;
  avgOnboardingDays: number;
  avgRetention: number;
}

export interface KpiTrend {
  label: string;
  direction: "up" | "down" | "neutral";
}

export interface NetworkInsight {
  id: string;
  severity: "high" | "medium" | "low";
  headline: string;
  context: string;
  actionLabel: string;
  actionHref: string;
}

export interface OperationalRisk {
  id: string;
  message: string;
  severity: "high" | "medium" | "low";
}

export interface NetworkRecommendation {
  id: string;
  priority: number;
  action: string;
  href: string;
}

export interface ExpansionOpportunity {
  msaId: string;
  name: string;
  estimatedRevenuePotential: number;
  marketStrength: number;
  priority: "High" | "Medium" | "Low";
}

export interface BenchmarkMetric {
  id: string;
  label: string;
  value: string;
  industry: string;
  status: "above" | "below" | "on_target";
}

export function getNetworkKpis(msas: MSA[]): NetworkKpis {
  const activeMsas = msas.filter((msa) => msa.status !== "inactive");
  const health = calculateNetworkHealthScore(activeMsas);

  return {
    revenue: Math.round(activeMsas.reduce((sum, msa) => sum + msa.revenue, 0)),
    patients: Math.round(activeMsas.reduce((sum, msa) => sum + msa.patients, 0)),
    physicianGroups: activeMsas.reduce((sum, msa) => sum + msa.physicianGroups, 0),
    homeHealthAgencies: activeMsas.reduce((sum, msa) => sum + msa.homeHealthAgencies, 0),
    activeMarkets: activeMsas.length,
    avgMarketStrength: activeMsas.length
      ? Math.round(activeMsas.reduce((sum, msa) => sum + msa.healthScore, 0) / activeMsas.length)
      : 0,
    networkHealthScore: health.score,
    networkHealthTrend: health.trend,
    pgaConversionRate: activeMsas.length
      ? Math.round(
          (activeMsas.reduce((sum, msa) => sum + msa.conversionRate, 0) / activeMsas.length) * 10,
        ) / 10
      : 0,
    avgOnboardingDays: (() => {
      const withOnboarding = activeMsas.filter((msa) => msa.onboardingDays > 0);
      if (withOnboarding.length === 0) return 0;
      return Math.round(
        withOnboarding.reduce((sum, msa) => sum + msa.onboardingDays, 0) / withOnboarding.length,
      );
    })(),
    avgRetention: activeMsas.length
      ? Math.round(
          (activeMsas.reduce((sum, msa) => sum + (100 - msa.churnRate), 0) / activeMsas.length) *
            10,
        ) / 10
      : 0,
  };
}

export function calculateNetworkHealthScore(msas: MSA[]): { score: number; trend: number } {
  if (msas.length === 0) return { score: 0, trend: 0 };

  const avgRetention = msas.reduce((sum, msa) => sum + (100 - msa.churnRate), 0) / msas.length;
  const avgStrength = msas.reduce((sum, msa) => sum + msa.healthScore, 0) / msas.length;
  const avgConversion = msas.reduce((sum, msa) => sum + msa.conversionRate, 0) / msas.length;
  const withOnboarding = msas.filter((msa) => msa.onboardingDays > 0);
  const onboardingEfficiency =
    withOnboarding.length > 0
      ? Math.max(0, 100 - withOnboarding.reduce((s, m) => s + m.onboardingDays, 0) / withOnboarding.length)
      : 85;
  const revenueGrowth = Math.min(
    100,
    msas.reduce((sum, msa) => sum + msa.revenue, 0) / 1_000_000,
  );

  const score = Math.round(
    avgRetention * 0.25 +
      avgStrength * 0.25 +
      avgConversion * 0.2 +
      onboardingEfficiency * 0.15 +
      revenueGrowth * 0.15,
  );

  return { score: Math.min(100, score), trend: Math.max(1, Math.round(score / 28)) };
}

export function getNetworkKpiTrends(
  msas: MSA[],
  _dateRange: ResolvedDateRange,
  previousMsas?: MSA[] | null,
): Record<string, KpiTrend> {
  const current = getNetworkKpis(msas);

  if (!previousMsas || previousMsas.length === 0) {
    return {
      revenue: { label: "N/A", direction: "neutral" },
      patients: { label: "N/A", direction: "neutral" },
      physicianGroups: { label: "N/A", direction: "neutral" },
      homeHealthAgencies: { label: "N/A", direction: "neutral" },
      marketStrength: { label: "N/A", direction: "neutral" },
      networkHealth: { label: "N/A", direction: "neutral" },
    };
  }

  const previous = getNetworkKpis(previousMsas);

  return {
    revenue: formatKpiDelta(current.revenue, previous.revenue, "currency"),
    patients: formatKpiDelta(current.patients, previous.patients, "number"),
    physicianGroups: formatKpiDelta(current.physicianGroups, previous.physicianGroups, "number"),
    homeHealthAgencies: formatKpiDelta(
      current.homeHealthAgencies,
      previous.homeHealthAgencies,
      "number",
    ),
    marketStrength: formatKpiDelta(
      current.avgMarketStrength,
      previous.avgMarketStrength,
      "points",
    ),
    networkHealth: formatKpiDelta(
      current.networkHealthScore,
      previous.networkHealthScore,
      "points",
    ),
  };
}

function formatKpiDelta(
  current: number,
  previous: number,
  mode: "currency" | "number" | "points",
): KpiTrend {
  if (previous === 0 && current === 0) {
    return { label: "N/A", direction: "neutral" };
  }

  const delta = current - previous;
  const pct = previous !== 0 ? Math.round((delta / previous) * 100) : 0;
  const direction: KpiTrend["direction"] =
    delta > 0 ? "up" : delta < 0 ? "down" : "neutral";

  if (mode === "points") {
    const sign = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
    return { label: `${sign} ${Math.abs(delta)} pts`, direction };
  }

  const sign = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  return { label: `${sign} ${Math.abs(pct)}% vs prior period`, direction };
}

export type NetworkOverallStatus = "Healthy" | "Opportunity" | "Needs Attention";

export function getNetworkStatusSummary(msas: MSA[]) {
  const growing = msas.filter((msa) => msa.status === "growing").length;
  const intervention = msas.filter((msa) => msa.status === "attention-required").length;
  const inactive = msas.filter((msa) => msa.status === "inactive").length;
  const opportunity = msas.filter((msa) => msa.status === "opportunity").length;
  const newMarket = msas.filter((msa) => msa.status === "new-market").length;

  let overallStatus: NetworkOverallStatus = "Healthy";
  if (intervention >= 2 || msas.some((msa) => msa.status === "attention-required")) {
    overallStatus = "Needs Attention";
  } else if (opportunity + newMarket >= 2 || intervention === 1) {
    overallStatus = "Opportunity";
  }

  return { overallStatus, growing, intervention, inactive, opportunity, newMarket };
}

export function getActivationPipelineSummary(msas: MSA[]) {
  return {
    inactive: msas.filter((msa) => msa.status === "inactive").length,
    ready: msas.filter((msa) => msa.activationPipelineStatus === "ready").length,
    evaluation: msas.filter((msa) => msa.activationPipelineStatus === "evaluation").length,
    blocked: msas.filter((msa) => msa.activationPipelineStatus === "blocked").length,
  };
}

function mapExpansionRow(msa: MSA): ExpansionOpportunity {
  const potential =
    msa.revenue > 0
      ? Math.round(msa.revenue * 2)
      : Math.round(msa.population * 0.000316);
  const strength = msa.healthScore || Math.min(75, Math.round(60 + msa.population / 500_000));
  const priority: ExpansionOpportunity["priority"] =
    potential >= 1_500_000 ? "High" : potential >= 850_000 ? "Medium" : "Low";

  return {
    msaId: msa.id,
    name: getShortMarketName(msa.name),
    estimatedRevenuePotential: potential,
    marketStrength: strength,
    priority,
  };
}

function isExpansionCandidate(msa: MSA): boolean {
  if (msa.status === "inactive" || msa.status === "opportunity" || msa.status === "new-market") {
    return true;
  }

  const profile = resolveMsaDemoProfile(msa);
  return profile.tier === "opportunity";
}

export function getExpansionOpportunities(msas: MSA[]): ExpansionOpportunity[] {
  let candidates = msas.filter(isExpansionCandidate);

  if (candidates.length === 0 && isDemoMode()) {
    candidates = [...msas]
      .filter((msa) => msa.status !== "inactive")
      .sort((a, b) => {
        const profileA = resolveMsaDemoProfile(a);
        const profileB = resolveMsaDemoProfile(b);
        return (
          profileB.opportunityScoreTarget - profileA.opportunityScoreTarget ||
          b.population - a.population
        );
      })
      .slice(0, 8);
  }

  return candidates
    .map(mapExpansionRow)
    .sort((a, b) => b.estimatedRevenuePotential - a.estimatedRevenuePotential)
    .slice(0, 5);
}

export function getOperationalRisks(msas: MSA[]): OperationalRisk[] {
  const risks: OperationalRisk[] = [];
  const miami = getMsaById(msas, "miami-fl");
  const nashville = getMsaById(msas, "nashville-tn");
  const active = msas.filter((m) => m.status !== "inactive");
  const sorted = [...active].sort((a, b) => b.revenue - a.revenue);
  const topTwoShare =
    sorted.length >= 2
      ? (sorted[0].revenue + sorted[1].revenue) /
        Math.max(active.reduce((s, m) => s + m.revenue, 0), 1)
      : 0;

  if (miami && miami.churnRate > 5) {
    risks.push({
      id: "miami-retention",
      message: "Miami retention below target",
      severity: "high",
    });
  }
  if (nashville && nashville.onboardingDays > 44) {
    risks.push({
      id: "nashville-onboarding",
      message: "Nashville onboarding delays",
      severity: "medium",
    });
  }
  if (topTwoShare > 0.45) {
    risks.push({
      id: "revenue-concentration",
      message: "Revenue concentration risk in top two MSAs",
      severity: "medium",
    });
  }

  const attention = msas.filter((m) => m.status === "attention-required");
  attention.forEach((msa) => {
    risks.push({
      id: `attention-${msa.id}`,
      message: `${getShortMarketName(msa.name)} requires intervention`,
      severity: "high",
    });
  });

  return risks.slice(0, 5);
}

export function getNetworkRecommendations(msas: MSA[]): NetworkRecommendation[] {
  const recs: NetworkRecommendation[] = [];
  const miami = getMsaById(msas, "miami-fl");
  const nashville = getMsaById(msas, "nashville-tn");
  const atlanta = getMsaById(msas, "atlanta-ga");

  if (miami && miami.churnRate > 4) {
    recs.push({
      id: "miami-retention",
      priority: 1,
      action: "Improve Miami retention.",
      href: `/msa/${miami.id}/customer-success`,
    });
  }
  if (nashville && nashville.onboardingDays > 40) {
    recs.push({
      id: "nashville-onboarding",
      priority: 2,
      action: "Accelerate Nashville onboarding.",
      href: `/msa/${nashville.id}/pg-acquisition`,
    });
  }
  if (atlanta) {
    recs.push({
      id: "atlanta-pg",
      priority: 3,
      action: "Expand Atlanta PG acquisition.",
      href: `/msa/${atlanta.id}/pg-acquisition`,
    });
  }

  return recs.slice(0, 3);
}

export function getNetworkInsights(msas: MSA[]): NetworkInsight[] {
  const totalRevenue = getNetworkKpis(msas).revenue;
  const atlanta = getMsaById(msas, "atlanta-ga");
  const miami = getMsaById(msas, "miami-fl");
  const nashville = getMsaById(msas, "nashville-tn");

  const attention = msas.filter((m) => m.status === "attention-required");
  const growing = msas.filter((m) => m.status === "growing");

  if (!atlanta || !miami || !nashville) {
    const fallback = attention[0] ?? growing[0] ?? msas[0];
    if (!fallback) return [];
    return [
      {
        id: `${fallback.id}-insight`,
        severity: fallback.status === "attention-required" ? "high" : "medium",
        headline: `${getShortMarketName(fallback.name)} requires executive review.`,
        context: "Review operational metrics and partner health across this market.",
        actionLabel: "Open Market Analysis",
        actionHref: `/msa/${fallback.id}/market-analysis`,
      },
    ];
  }

  const atlantaShare = totalRevenue > 0 ? Math.round((atlanta.revenue / totalRevenue) * 100) : 0;
  const onboardingOverage = nashville.onboardingDays - 44;

  return [
    {
      id: "miami-retention",
      severity: "high",
      headline: `${getShortMarketName(miami.name)} retention dropped 1.8% this quarter.`,
      context:
        "Partner attrition threatens revenue stability. Immediate review of agency relationships is warranted.",
      actionLabel: "Review Customer Success",
      actionHref: `/msa/${miami.id}/customer-success`,
    },
    {
      id: "nashville-onboarding",
      severity: "medium",
      headline: `${getShortMarketName(nashville.name)} onboarding exceeds target by ${onboardingOverage} days.`,
      context:
        "Delayed partner activation slows market ramp. PGA funnel and onboarding workflows need review.",
      actionLabel: "Analyze PGA Funnel",
      actionHref: `/msa/${nashville.id}/pg-acquisition`,
    },
    {
      id: "atlanta-revenue",
      severity: "low",
      headline: `${getShortMarketName(atlanta.name)} contributes ${atlantaShare}% of network revenue.`,
      context:
        "Concentration risk is moderate. Validate market drivers before increasing expansion investment.",
      actionLabel: "Explore Market Drivers",
      actionHref: `/msa/${atlanta.id}/market-analysis`,
    },
  ];
}

export function getBenchmarkMetrics(msas: MSA[]): BenchmarkMetric[] {
  const kpis = getNetworkKpis(msas);

  return [
    {
      id: "retention",
      label: "Retention",
      value: formatPercent(kpis.avgRetention),
      industry: "95.4%",
      status: kpis.avgRetention >= 95.4 ? "above" : kpis.avgRetention >= 94 ? "on_target" : "below",
    },
    {
      id: "conversion",
      label: "Conversion",
      value: formatPercent(kpis.pgaConversionRate),
      industry: "31.8%",
      status:
        kpis.pgaConversionRate >= 31.8 ? "above" : kpis.pgaConversionRate >= 30 ? "on_target" : "below",
    },
    {
      id: "onboarding",
      label: "Onboarding",
      value: kpis.avgOnboardingDays > 0 ? `${kpis.avgOnboardingDays} days` : "Complete",
      industry: "60 days",
      status:
        kpis.avgOnboardingDays === 0 || kpis.avgOnboardingDays <= 60
          ? "above"
          : kpis.avgOnboardingDays <= 65
            ? "on_target"
            : "below",
    },
  ];
}

export function getMarketDistribution(msas: MSA[]) {
  return {
    growing: msas.filter((m) => m.status === "growing").length,
    opportunity: msas.filter((m) => m.status === "opportunity").length,
    attentionRequired: msas.filter((m) => m.status === "attention-required").length,
    inactive: msas.filter((m) => m.status === "inactive").length,
  };
}

export function getRevenueByMsa(msas: MSA[]) {
  return [...msas]
    .filter((m) => m.status !== "inactive" && m.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map((m) => ({
      id: m.id,
      name: getShortMarketName(m.name),
      revenue: m.revenue,
    }));
}
