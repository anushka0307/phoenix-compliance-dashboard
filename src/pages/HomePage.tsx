import { AlertTriangle, TrendingUp } from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";
import {
  getAttentionRequiredMsas,
  getTopPerformingMsas,
} from "@/data/mockMsas";
import { DashboardTimeFilter } from "@/components/dashboard/DashboardTimeFilter";
import { ExpansionOpportunitiesTable } from "@/components/dashboard/ExpansionOpportunitiesTable";
import { RecommendedActionsCard } from "@/components/dashboard/RecommendedActionsCard";
import { MarketDistributionChart } from "@/components/dashboard/MarketDistributionChart";
import { RiskRegisterCard } from "@/components/dashboard/RiskRegisterCard";
import { ActionableInsights } from "@/components/ActionableInsights";
import { ExecutiveKpiStrip } from "@/components/ExecutiveKpiStrip";
import { MarketSummaryCard } from "@/components/MarketSummaryCard";
import { UsMsaMap } from "@/components/UsMsaMap";
import { Card } from "@/components/ui/card";

export function HomePage() {
  const { dashboardMsas } = useNetwork();
  const topMarkets = getTopPerformingMsas(dashboardMsas);
  const attentionMarkets = getAttentionRequiredMsas(dashboardMsas);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Select a market on the map to review expansion performance and operating functions
          </p>
        </div>
        <DashboardTimeFilter className="shrink-0 self-start" />
      </header>

      <ExecutiveKpiStrip />

      <section aria-label="US MSA network map" className="min-w-0">
        <UsMsaMap className="h-[calc(100vh-320px)] min-h-[700px] w-full" />
      </section>

      <section
        aria-label="Market performance"
        className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start"
      >
        <Card className="flex h-full flex-col rounded-2xl border border-border p-6 shadow-sm">
          <div className="shrink-0">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="size-4 text-emerald-600" />
              Top-Performing Markets
            </h2>
            <p className="text-sm text-muted-foreground">
              Highest market strength among growing MSAs
            </p>
          </div>
          <div className="mt-3 max-h-[420px] flex-1 space-y-1.5 overflow-y-auto">
            {topMarkets.length > 0 ? (
              topMarkets.map((msa) => <MarketSummaryCard key={msa.id} msa={msa} />)
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No markets currently match this criteria.
              </p>
            )}
          </div>
        </Card>

        <Card className="flex h-full flex-col rounded-2xl border border-border p-6 shadow-sm">
          <div className="shrink-0">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="size-4 text-red-500" />
              Markets Requiring Attention
            </h2>
            <p className="text-sm text-muted-foreground">
              Markets requiring executive intervention
            </p>
          </div>
          <div className="mt-3 max-h-[420px] flex-1 space-y-1.5 overflow-y-auto">
            {attentionMarkets.length > 0 ? (
              attentionMarkets.map((msa) => <MarketSummaryCard key={msa.id} msa={msa} />)
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No markets currently match this criteria.
              </p>
            )}
          </div>
        </Card>
      </section>

      <ActionableInsights />

      <section className="space-y-3" aria-label="Risks and opportunities">
        <div>
          <h2 className="text-base font-semibold">Risks &amp; Opportunities</h2>
          <p className="text-sm text-muted-foreground">
            Operational risks and highest-growth expansion targets
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <RiskRegisterCard />
          <ExpansionOpportunitiesTable />
        </div>
      </section>

      <section className="space-y-3" aria-label="Expansion recommendations">
        <div>
          <h2 className="text-base font-semibold">Expansion Recommendations</h2>
          <p className="text-sm text-muted-foreground">Prioritized actions for network growth</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <RecommendedActionsCard />
          <MarketDistributionChart />
        </div>
      </section>
    </div>
  );
}
