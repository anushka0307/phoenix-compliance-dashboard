import {
  Building2,
  HeartPulse,
  TrendingUp,
  Users,
} from "lucide-react";
import type { MSA } from "@/types/msa";
import { KpiCard } from "@/components/KpiCard";
import { formatCurrency, formatNumber } from "@/utils/format";
import { formatTam, getOpportunityMetrics } from "@/utils/geographyCoverage";
import { isMsaActivated } from "@/utils/msaActivation";

interface MsaOverviewKpisProps {
  msa: MSA;
}

export function MsaOverviewKpis({ msa }: MsaOverviewKpisProps) {
  const isInactive = msa.status === "inactive" || !isMsaActivated(msa);
  const opportunity = getOpportunityMetrics(msa.population);

  if (isInactive) {
    return (
      <section
        aria-label="Opportunity overview"
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        <KpiCard
          label="Population"
          value={formatNumber(opportunity.population)}
          icon={Users}
          subtext="CBSA / geography total"
        />
        <KpiCard
          label="Medicare Population (Est.)"
          value={formatNumber(opportunity.medicarePopulation)}
          icon={HeartPulse}
          subtext="~18% of total population"
        />
        <KpiCard
          label="Estimated TAM"
          value={formatTam(opportunity.estimatedTam)}
          icon={TrendingUp}
          subtext="Total addressable market"
        />
        <KpiCard
          label="Est. Physician Groups"
          value={formatNumber(opportunity.estimatedPhysicianGroups)}
          icon={Building2}
          subtext={`${formatNumber(opportunity.estimatedPhysicians)} physicians`}
        />
        <KpiCard
          label="Est. Home Health Agencies"
          value={formatNumber(opportunity.estimatedHhas)}
          icon={Building2}
          subtext={`${formatNumber(opportunity.estimatedPatients)} patients`}
        />
      </section>
    );
  }

  if (msa.status === "new-market") {
    return (
      <section
        aria-label="New market overview"
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        <KpiCard
          label="Annual Revenue"
          value={formatCurrency(msa.revenue)}
          icon={TrendingUp}
          subtext="Early-stage estimate"
        />
        <KpiCard
          label="Active Patients"
          value={formatNumber(msa.patients)}
          icon={Users}
          subtext="Estimated under management"
        />
        <KpiCard
          label="Market Strength"
          value={String(msa.healthScore || 52)}
          icon={HeartPulse}
          subtext="Early classification"
        />
        <KpiCard
          label="Partner Retention"
          value={`${(100 - msa.churnRate).toFixed(1)}%`}
          icon={TrendingUp}
          subtext="Baseline estimate"
        />
        <KpiCard
          label="Physician Groups"
          value={String(msa.physicianGroups)}
          icon={Building2}
        />
        <KpiCard
          label="Home Health Agencies"
          value={String(msa.homeHealthAgencies)}
          icon={Building2}
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Overview KPIs"
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
    >
      <KpiCard
        label="Annual Revenue"
        value={formatCurrency(msa.revenue)}
        icon={TrendingUp}
        subtext="Trailing 12 months"
      />
      <KpiCard
        label="Active Patients"
        value={formatNumber(msa.patients)}
        icon={Users}
        subtext="Under management"
      />
      <KpiCard
        label="Market Strength"
        value={String(msa.healthScore)}
        icon={HeartPulse}
        subtext={msa.healthScore >= 80 ? "Strong performance" : "Needs attention"}
        trend={msa.healthScore >= 80 ? "up" : "down"}
      />
      <KpiCard
        label="Partner Retention"
        value={`${(100 - msa.churnRate).toFixed(1)}%`}
        icon={TrendingUp}
        subtext={`${msa.physicianGroups} physician groups`}
        trend={msa.churnRate > 5 ? "down" : "neutral"}
      />
      <KpiCard
        label="Physician Groups"
        value={String(msa.physicianGroups)}
        icon={Building2}
      />
      <KpiCard
        label="Home Health Agencies"
        value={String(msa.homeHealthAgencies)}
        icon={Building2}
      />
    </section>
  );
}
