import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePortfolio } from "@/contexts/NetworkContext";
import { useMsa } from "@/hooks/useMsa";
import { AlertCenterSection } from "@/components/market-analysis/AlertCenterSection";
import { BusinessAnalyticsSection } from "@/components/market-analysis/BusinessAnalyticsSection";
import { CompetitiveLandscapeSection } from "@/components/market-analysis/CompetitiveLandscapeSection";
import { CoreKpiStrip } from "@/components/market-analysis/CoreKpiStrip";
import { CoverageAnalysisSection } from "@/components/market-analysis/CoverageAnalysisSection";
import { ExecutiveSummarySection } from "@/components/market-analysis/ExecutiveSummarySection";
import { InsufficientDataPanel } from "@/components/InsufficientDataPanel";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { MarketFundamentalsSection } from "@/components/market-analysis/MarketFundamentalsSection";
import { MsaClassificationDebugPanel } from "@/components/market-analysis/MsaClassificationDebugPanel";
import { NextBestActionCard } from "@/components/market-analysis/NextBestActionCard";
import { OpportunityMatrixSection } from "@/components/market-analysis/OpportunityMatrixSection";
import { PhysicianNetworkSection } from "@/components/market-analysis/PhysicianNetworkSection";
import { PgAcquisitionReadinessSection } from "@/components/market-analysis/PgAcquisitionReadinessSection";
import { ReferralNetworkSection } from "@/components/market-analysis/ReferralNetworkSection";
import { RecommendationsSection } from "@/components/market-analysis/RecommendationsSection";
import { ScenarioPlanningSection } from "@/components/market-analysis/ScenarioPlanningSection";
import { TrendAnalysisSection } from "@/components/market-analysis/TrendAnalysisSection";
import { maPage } from "@/components/market-analysis/marketAnalysisLayout";
import { buildMarketAnalysisWorkspace } from "@/utils/marketAnalysisHelpers";
import { getOperationalReadiness, shouldShowInsufficientDataEmptyState } from "@/utils/marketOperationalReadiness";
import { cn } from "@/utils/cn";

export function MarketAnalysisPage() {
  const { msa } = useMsa();
  const { dashboardMsas } = usePortfolio();

  const workspace = useMemo(() => {
    if (!msa) return null;
    return buildMarketAnalysisWorkspace(msa, dashboardMsas);
  }, [msa, dashboardMsas]);

  const readiness = useMemo(() => (msa ? getOperationalReadiness(msa) : null), [msa]);
  const showInsufficient = msa ? shouldShowInsufficientDataEmptyState(msa) : false;

  if (!msa || !workspace) return null;

  return (
    <div className={cn(maPage)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <CoreKpiStrip kpis={workspace.coreKpis} />

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="mb-3 flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="competition">Competition</TabsTrigger>
              <TabsTrigger value="network">Network Intelligence</TabsTrigger>
              <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <AlertCenterSection alerts={workspace.alerts} />
              <ExecutiveSummarySection summary={workspace.executiveSummary} />
              <MarketFundamentalsSection fundamentals={workspace.fundamentals} />
            </TabsContent>

            <TabsContent value="coverage" className="space-y-4">
              <CoverageAnalysisSection
                countyGaps={workspace.coverageIntelligence.countyGaps}
                penetrationTarget={workspace.coverageIntelligence.penetrationTarget}
              />
              <BusinessAnalyticsSection
                analytics={workspace.businessAnalytics}
                showAdvancedMetrics={!showInsufficient}
                insufficientLabel={readiness?.label}
                insufficientReasons={readiness?.reasons}
              />
            </TabsContent>

            <TabsContent value="competition" className="space-y-4">
              <CompetitiveLandscapeSection metrics={workspace.competitive} />
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              {showInsufficient ? (
                <MarketAnalysisSection
                  title="Referral Network Intelligence"
                  subtitle="PG → HHA → County referral flow"
                  emphasis="secondary"
                  compact
                >
                  <InsufficientDataPanel label={readiness?.label} reasons={readiness?.reasons} />
                </MarketAnalysisSection>
              ) : (
                <ReferralNetworkSection network={workspace.referralNetwork} />
              )}
              <PhysicianNetworkSection network={workspace.physicianNetwork} />
              <PgAcquisitionReadinessSection targets={workspace.pgAcquisitionTargets} />
            </TabsContent>

            <TabsContent value="forecasting" className="space-y-4">
              <OpportunityMatrixSection opportunities={workspace.opportunities} />
              {showInsufficient ? (
                <MarketAnalysisSection
                  title="Trend Analysis"
                  subtitle="Sparklines with YoY direction and prior-quarter comparison"
                  emphasis="secondary"
                  compact
                >
                  <InsufficientDataPanel label={readiness?.label} reasons={readiness?.reasons} />
                </MarketAnalysisSection>
              ) : (
                <TrendAnalysisSection trends={workspace.trends} />
              )}
              <ScenarioPlanningSection baseline={workspace.scenarioBaseline} />
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <RecommendationsSection recommendations={workspace.recommendations} msa={msa} />
            </TabsContent>
          </Tabs>
        </div>

        <NextBestActionCard focus={workspace.pgFocus} msa={msa} variant="sidebar" />
      </div>
      <MsaClassificationDebugPanel />
    </div>
  );
}
