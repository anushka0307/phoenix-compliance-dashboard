import { useMemo, useState } from "react";
import { Megaphone, Target, Users } from "lucide-react";
import type { MSA } from "@/types/msa";
import type { PgAcquisitionStage } from "@/types/pgAcquisition";
import { getStageLabel } from "@/types/pgAcquisition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcquisitionFunnel } from "@/components/pg-acquisition/AcquisitionFunnel";
import { HorizontalBarChart } from "@/components/market-analysis/HorizontalBarChart";
import { KpiCard } from "@/components/KpiCard";
import {
  getFunnelMetrics,
  getHotOpportunities,
  getPipelineKpis,
} from "@/utils/pgAcquisitionStore";
import { getPgAcquisitionWorkspaceWithCampaigns } from "@/utils/pgCampaignBridge";
import { useOptionalCampaignNavigation } from "@/contexts/CampaignNavigationContext";
import { buildLaunchContextFromMsa } from "@/utils/acquisitionCampaignStore";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

interface PgAcquisitionDashboardProps {
  msa: MSA;
}

export function PgAcquisitionDashboard({ msa }: PgAcquisitionDashboardProps) {
  const campaignNav = useOptionalCampaignNavigation();
  const workspace = useMemo(() => getPgAcquisitionWorkspaceWithCampaigns(msa), [msa]);
  const funnel = useMemo(() => getFunnelMetrics(workspace), [workspace]);
  const kpis = useMemo(() => getPipelineKpis(workspace), [workspace]);
  const hotOpps = useMemo(() => getHotOpportunities(workspace), [workspace]);
  const [selectedStage, setSelectedStage] = useState<PgAcquisitionStage | null>(null);

  const selected = selectedStage ? funnel.find((stage) => stage.id === selectedStage) : null;
  const prevStage = selected
    ? funnel.find((stage) => stage.order === (selected.order ?? 0) - 1)
    : null;
  const conversionRate =
    selected && prevStage && prevStage.count > 0
      ? Math.round((selected.count / prevStage.count) * 100)
      : null;

  const filteredHotOpps = useMemo(() => {
    if (!selectedStage) return hotOpps;
    return workspace.pgs.filter((pg) => pg.stage === selectedStage);
  }, [hotOpps, selectedStage, workspace.pgs]);

  const influentialAgencies = [...workspace.agencies]
    .filter((agency) => agency.linkedPgIds.length > 1)
    .sort((a, b) => b.referralInfluence - a.referralInfluence)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Acquisition Funnel</h2>
          <p className="text-sm text-muted-foreground">
            Pipeline stages, value, and conversion for {msa.name}
          </p>
        </div>
        <Button
          disabled={!workspace.campaignsEnabled || workspace.pgs.length === 0}
          onClick={() =>
            campaignNav?.openCampaignWizard(
              buildLaunchContextFromMsa(msa, { source: "pg-acquisition" }),
            )
          }
        >
          <Megaphone className="mr-2 size-4" />
          Create Acquisition Campaign
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pipeline funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <AcquisitionFunnel
              stages={funnel}
              selectedStage={selectedStage}
              onSelectStage={setSelectedStage}
            />
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
              {selected ? (
                <div className="space-y-2">
                  <p className="font-semibold">{selected.label}</p>
                  <p className="text-xs text-muted-foreground">{selected.description}</p>
                  <dl className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">PGs in stage</dt>
                      <dd className="font-medium tabular-nums">{selected.count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pipeline value</dt>
                      <dd className="font-medium tabular-nums">{formatCurrency(selected.pipelineValue)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Avg days in stage</dt>
                      <dd className="font-medium tabular-nums">{selected.avgDaysInStage} days</dd>
                    </div>
                    {conversionRate !== null && prevStage && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Conversion from {prevStage.label}</dt>
                        <dd className="font-medium tabular-nums">{formatPercent(conversionRate)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click a funnel stage to filter the dashboard and view stage details.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total PGs" value={formatNumber(kpis.total)} icon={Users} />
        <KpiCard label="Active opportunities" value={formatNumber(kpis.activeOpps)} icon={Target} />
        <KpiCard label="Win rate" value={formatPercent(kpis.winRate)} />
        <KpiCard label="Avg sales cycle" value={`${kpis.avgCycle} days`} />
        <KpiCard
          label="Stage conversion"
          value={
            kpis.conversions[0]
              ? `${formatPercent(kpis.conversions[0].rate)}`
              : "—"
          }
          subtext={kpis.conversions[0] ? `${kpis.conversions[0].from} → ${kpis.conversions[0].to}` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Campaign performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Active campaigns</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {workspace.campaigns.activeCampaigns}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Open rate</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatPercent(workspace.campaigns.openRate)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Meeting conversion</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatPercent(workspace.campaigns.meetingConversionRate)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Demo conversion</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatPercent(workspace.campaigns.demoConversionRate)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks due.</p>
            ) : (
              workspace.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>{task.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {task.dueLabel}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Hot opportunities
              {selectedStage && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {getStageLabel(selectedStage)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredHotOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedStage
                  ? `No PGs in ${getStageLabel(selectedStage)}.`
                  : "No active opportunities in pipeline."}
              </p>
            ) : (
              filteredHotOpps.map((pg) => (
                <div key={pg.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{pg.name}</span>
                    <Badge variant="outline">{getStageLabel(pg.stage)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Score {pg.opportunityScore} · {formatNumber(pg.referralVolume)} referrals/mo ·{" "}
                    {pg.hhaOverlapCount} HHA overlap
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agency influence map</CardTitle>
          </CardHeader>
          <CardContent>
            {influentialAgencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Link HHAs during activation to surface warm introduction paths.
              </p>
            ) : (
              <HorizontalBarChart
                items={influentialAgencies.map((agency) => ({
                  label: agency.name,
                  value: agency.referralInfluence,
                  sublabel: `${agency.linkedPgIds.length} PGs`,
                }))}
                format="number"
              />
            )}
            <div className="mt-3 space-y-1">
              {workspace.agencies.slice(0, 4).map((agency) => (
                <p key={agency.id} className="text-xs text-muted-foreground">
                  {agency.name} · {agency.relationshipStrength} · influence{" "}
                  {agency.referralInfluence}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
