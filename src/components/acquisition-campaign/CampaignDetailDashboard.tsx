import { Link } from "react-router-dom";
import type { AcquisitionCampaign } from "@/types/acquisitionCampaign";
import { getChannelLabel } from "@/types/acquisitionCampaign";
import { CampaignExecutionFunnel } from "@/components/acquisition-campaign/CampaignExecutionFunnel";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

interface CampaignDetailDashboardProps {
  campaign: AcquisitionCampaign;
  msaId: string;
}

export function CampaignDetailDashboard({ campaign, msaId }: CampaignDetailDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{campaign.name}</h2>
            <Badge variant="secondary">{campaign.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {campaign.msaName} · {campaign.owner} · {campaign.startDate} → {campaign.endDate}
          </p>
        </div>
        <Link
          to={`/msa/${msaId}/pg-acquisition`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to PG Acquisition
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Target PGs" value={formatNumber(campaign.kpis.targetPgs)} />
        <KpiCard label="Contacted PGs" value={formatNumber(campaign.kpis.contactedPgs)} />
        <KpiCard label="Response rate" value={formatPercent(campaign.kpis.responseRate)} />
        <KpiCard label="Meetings booked" value={formatNumber(campaign.kpis.meetingsBooked)} />
        <KpiCard label="Demos completed" value={formatNumber(campaign.kpis.demosCompleted)} />
        <KpiCard label="Opportunities" value={formatNumber(campaign.kpis.opportunitiesCreated)} />
        <KpiCard label="PGs onboarded" value={formatNumber(campaign.kpis.pgsOnboarded)} />
        <KpiCard label="Revenue influenced" value={formatCurrency(campaign.kpis.revenueInfluenced)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Campaign funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignExecutionFunnel stages={campaign.funnel} />
            <div className="mt-3 space-y-1">
              {campaign.funnel.map((stage) => (
                <p key={stage.stage} className="flex justify-between text-xs text-muted-foreground">
                  <span>{stage.label}</span>
                  <span>
                    {stage.count} · {formatPercent(stage.conversionFromPrevious ?? 0)} ·{" "}
                    {formatCurrency(stage.pipelineValue)}
                  </span>
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance by channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaign.channelPerformance.map((perf) => (
              <div key={perf.channel} className="rounded-md border px-3 py-2 text-xs">
                <p className="font-medium">{getChannelLabel(perf.channel)}</p>
                <p className="text-muted-foreground">
                  Open {formatPercent(perf.openRate)} · Reply {formatPercent(perf.replyRate)}
                  {perf.acceptanceRate > 0 && ` · Accept ${formatPercent(perf.acceptanceRate)}`}
                  {perf.callConversionRate > 0 && ` · Call ${formatPercent(perf.callConversionRate)}`}
                  · Meeting {formatPercent(perf.meetingConversionRate)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaign.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{task.label}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {task.dueLabel}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaign.attributions.map((attr) => (
              <div key={attr.pgId} className="rounded-md border px-3 py-2 text-xs">
                <p className="font-medium">{attr.pgName}</p>
                <p className="text-muted-foreground">
                  via {getChannelLabel(attr.channel)} · Pipeline {formatCurrency(attr.pipelineCreated)} ·
                  Revenue {formatCurrency(attr.revenueInfluenced)} · CPA {formatCurrency(attr.costPerAcquisition)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
