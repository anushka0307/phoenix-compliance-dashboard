import type { CustomerSuccessWorkspace, ExpansionFunnelStage } from "@/types/customerSuccess";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { HorizontalBarChart } from "@/components/market-analysis/HorizontalBarChart";
import { Sparkline } from "@/components/market-analysis/charts/Sparkline";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LifecycleGate } from "@/components/customer-success/LifecycleGate";
import { AccountMapVisualization } from "@/components/customer-success/AccountMapVisualization";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface TabProps {
  workspace: CustomerSuccessWorkspace;
}

const ALERT_CLASS = {
  positive: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  warning: "border-amber-200 bg-amber-50/80 text-amber-900",
  risk: "border-red-200 bg-red-50/80 text-red-900",
};

export function CsOverviewTab({ workspace }: TabProps) {
  const { topKpis, healthBreakdown, overviewMetrics, alerts, header } = workspace;
  const isOnboarding = header.lifecycleStage === "onboarding";

  return (
    <div className="space-y-4">
      {isOnboarding && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-medium text-primary">Implementation in progress</p>
          <p className="mt-1 text-muted-foreground">
            Focus on onboarding milestones, training completion, and initial value delivery. Full health scoring unlocks after stabilization.
          </p>
        </div>
      )}
      <MarketAnalysisSection title="Account Health" subtitle="Weighted value and rapport score" emphasis="primary" compact>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Account Health Score</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">{topKpis.accountHealthScore}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Previous: {topKpis.previousHealthScore} ·{" "}
              {topKpis.accountHealthScore >= topKpis.previousHealthScore ? "Improving" : "Declining"}
            </p>
          </div>
          <HorizontalBarChart
            items={[
              { label: "Value Fulfilment", value: healthBreakdown.valueFulfilment },
              { label: "Value Communication", value: healthBreakdown.valueCommunication },
              { label: "Rapport", value: healthBreakdown.rapport },
              { label: "Adoption", value: healthBreakdown.adoption },
              { label: "Support Experience", value: healthBreakdown.supportExperience },
              { label: "Expansion Readiness", value: healthBreakdown.expansionReadiness },
            ]}
            format="number"
            maxValue={100}
          />
        </div>
      </MarketAnalysisSection>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Monthly recurring revenue" value={formatCurrency(overviewMetrics.monthlyRecurringRevenue)} />
        <KpiCard label="Claims processed" value={formatNumber(overviewMetrics.claimsProcessed)} />
        <KpiCard label="Claims acceptance" value={formatPercent(overviewMetrics.claimsAcceptanceRate)} />
        <KpiCard label="Billing turnaround" value={`${overviewMetrics.billingTurnaroundDays} days`} />
        <KpiCard label="Avg response time" value={`${overviewMetrics.averageResponseTimeHours}h`} />
        <KpiCard label="Active users" value={String(overviewMetrics.activeUsers)} />
        <KpiCard label="Open tickets" value={String(overviewMetrics.openTickets)} />
        <KpiCard label="Expansion opportunities" value={String(overviewMetrics.expansionOpportunities)} />
      </div>

      <MarketAnalysisSection title="Alerts Center" subtitle="Actions to retain, grow, or rescue" emphasis="secondary" compact>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn("rounded-md border px-3 py-2 text-sm", ALERT_CLASS[alert.sentiment])}
            >
              {alert.message}
            </div>
          ))}
        </div>
      </MarketAnalysisSection>
    </div>
  );
}

export function CsValueFulfilmentTab({ workspace }: TabProps) {
  const { billing, codePerformance, hhahCoordination, valueSummary, gates } = workspace;

  return (
    <LifecycleGate available={gates.valueFulfilment.available} message={gates.valueFulfilment.message}>
      <div className="space-y-4">
        <MarketAnalysisSection title="Billing Performance" subtitle="Prove ROI through claims and revenue" emphasis="primary" compact>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Claims submitted" value={formatNumber(billing.claimsSubmitted)} />
            <KpiCard label="Claims approved" value={formatNumber(billing.claimsApproved)} />
            <KpiCard label="Denial rate" value={formatPercent(billing.denialRate)} />
            <KpiCard label="Avg reimbursement" value={`${billing.avgReimbursementDays} days`} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Monthly claims trend</CardTitle>
              </CardHeader>
              <CardContent>
                <Sparkline data={billing.monthlyClaimsTrend} width={320} height={48} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenue trend</CardTitle>
              </CardHeader>
              <CardContent>
                <Sparkline data={billing.monthlyRevenueTrend} width={320} height={48} strokeClassName="stroke-emerald-600" fillClassName="fill-emerald-500/10" />
              </CardContent>
            </Card>
          </div>
          <div className="mt-3">
            <HorizontalBarChart
              items={billing.denialsByReason.map((d) => ({ label: d.reason, value: d.count }))}
              format="number"
            />
          </div>
        </MarketAnalysisSection>

        <MarketAnalysisSection title="Code-Level Performance" emphasis="secondary" compact>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Volume</th>
                  <th className="pb-2 pr-4">Revenue</th>
                  <th className="pb-2">Growth</th>
                </tr>
              </thead>
              <tbody>
                {codePerformance.map((row) => (
                  <tr key={row.code} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{row.label}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatNumber(row.volume)}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatCurrency(row.revenue)}</td>
                    <td className="py-2 tabular-nums">{formatPercent(row.growthRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MarketAnalysisSection>

        <MarketAnalysisSection title="HHAH Coordination" subtitle="Operational value delivery" emphasis="secondary" compact>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Active HHAHs" value={String(hhahCoordination.activeHhahs)} />
            <KpiCard label="Orders processed" value={formatNumber(hhahCoordination.ordersProcessed)} />
            <KpiCard label="Order turnaround" value={`${hhahCoordination.avgOrderTurnaroundDays} days`} />
            <KpiCard label="Documentation completion" value={formatPercent(hhahCoordination.documentationCompletionRate)} />
            <KpiCard label="Escalation rate" value={formatPercent(hhahCoordination.escalationRate)} />
          </div>
        </MarketAnalysisSection>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Value Realization Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div><span className="text-muted-foreground">Revenue generated</span><p className="font-semibold">{formatCurrency(valueSummary.revenueGenerated)}</p></div>
            <div><span className="text-muted-foreground">Hours saved</span><p className="font-semibold">{formatNumber(valueSummary.hoursSaved)}</p></div>
            <div><span className="text-muted-foreground">Admin burden reduced</span><p className="font-semibold">{formatPercent(valueSummary.adminBurdenReducedPct)}</p></div>
            <div><span className="text-muted-foreground">Faster billing cycle</span><p className="font-semibold">{valueSummary.billingCycleImprovementDays} days</p></div>
            <div><span className="text-muted-foreground">Denial reduction</span><p className="font-semibold">{formatPercent(valueSummary.denialReductionPct)}</p></div>
            <div className="sm:col-span-2 lg:col-span-3 rounded-md bg-primary/5 px-3 py-2">
              <span className="text-muted-foreground">Estimated value delivered this quarter</span>
              <p className="text-lg font-semibold text-primary">{formatCurrency(valueSummary.estimatedQuarterlyValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LifecycleGate>
  );
}

export function CsValueCommunicationTab({ workspace }: TabProps) {
  const { reviewCadence, meetingEffectiveness, executiveEngagement, communicationHealthScore, gates } = workspace;

  return (
    <LifecycleGate available={gates.valueCommunication.available} message={gates.valueCommunication.message}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium">Communication Health Score</span>
          <span className="text-2xl font-semibold tabular-nums">{communicationHealthScore}</span>
        </div>

        <MarketAnalysisSection title="Communication Cadence" subtitle="WBR · MBR · QBR timeline" emphasis="primary" compact>
          <div className="relative space-y-3 pl-4 before:absolute before:left-1 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
            {reviewCadence.map((review) => (
              <div key={review.type} className="relative flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm before:absolute before:-left-4 before:top-4 before:size-2 before:rounded-full before:bg-primary">
                <div>
                  <span className="font-medium">{review.type}</span>
                  <p className="text-xs text-muted-foreground">
                    Last: {review.lastDate ?? "—"} · Next: {review.nextDate ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatPercent(review.attendanceRate)} attendance</span>
                  <Badge variant={review.status === "overdue" ? "destructive" : "secondary"}>{review.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </MarketAnalysisSection>

        {meetingEffectiveness.length > 0 && (
          <MarketAnalysisSection title="Meeting Effectiveness" subtitle="Participants, topics, and follow-through" emphasis="secondary" compact>
            <div className="space-y-3">
              {meetingEffectiveness.map((meeting) => (
                <div key={`${meeting.reviewType}-${meeting.date}`} className="rounded-md border px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{meeting.reviewType} · {meeting.date}</p>
                    <Badge variant="secondary">{formatPercent(meeting.followUpCompletionRate)} follow-up complete</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Participants: {meeting.participants.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Topics: {meeting.topicsCovered.join(" · ")}
                  </p>
                  <p className="mt-1 text-xs">{meeting.actionItems} action items tracked</p>
                </div>
              ))}
            </div>
          </MarketAnalysisSection>
        )}

        <MarketAnalysisSection title="Executive Engagement" emphasis="secondary" compact>
          <div className="grid gap-2 sm:grid-cols-2">
            {executiveEngagement.map((exec) => (
              <div key={exec.role} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">{exec.role}</p>
                <p className="text-xs text-muted-foreground">
                  {exec.meetingsAttended} meetings · {formatPercent(exec.responseRate)} response · Last: {exec.lastInteraction}
                </p>
              </div>
            ))}
          </div>
        </MarketAnalysisSection>
      </div>
    </LifecycleGate>
  );
}

export function CsRapportTab({ workspace }: TabProps) {
  const { rapportScore, accountMap, personaMatrix, championTracker, gates } = workspace;

  return (
    <LifecycleGate available={gates.rapport.available} message={gates.rapport.message}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium">Rapport Score</span>
          <span className="text-2xl font-semibold tabular-nums">{rapportScore}</span>
        </div>

        <MarketAnalysisSection title="Account Map" subtitle="Strategic relationship network" emphasis="primary" compact>
          <AccountMapVisualization nodes={accountMap.nodes} links={accountMap.links} />
        </MarketAnalysisSection>

        <MarketAnalysisSection title="Persona Coverage Matrix" emphasis="secondary" compact>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3">Persona</th>
                  <th className="pb-2 pr-3">Owner</th>
                  <th className="pb-2 pr-3">Influence</th>
                  <th className="pb-2 pr-3">Frequency</th>
                  <th className="pb-2 pr-3">Sentiment</th>
                  <th className="pb-2 pr-3">Last interaction</th>
                  <th className="pb-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {personaMatrix.map((row) => (
                  <tr key={row.persona} className={cn("border-b border-border/50", row.missing && "bg-amber-50/50")}>
                    <td className="py-2 pr-3 font-medium">{row.persona}{row.missing && " ⚠"}</td>
                    <td className="py-2 pr-3">{row.owner}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.influence || "—"}</td>
                    <td className="py-2 pr-3">{row.engagementFrequency}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.sentiment || "—"}</td>
                    <td className="py-2 pr-3">{row.lastInteraction}</td>
                    <td className="py-2"><Badge variant={row.riskLevel === "high" ? "destructive" : row.riskLevel === "medium" ? "warning" : "secondary"}>{row.riskLevel}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MarketAnalysisSection>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Champion Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Primary champion:</span> {championTracker.primaryChampion}</p>
            <p><span className="text-muted-foreground">Executive sponsor:</span> {championTracker.executiveSponsor ?? "Not identified"}</p>
            <p><span className="text-muted-foreground">Strength / Risk:</span> {championTracker.strengthScore} / {championTracker.riskScore}</p>
            {championTracker.alerts.map((alert) => (
              <p key={alert} className="text-xs text-amber-800">• {alert}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </LifecycleGate>
  );
}

const EXPANSION_STAGES: ExpansionFunnelStage[] = [
  "Identified",
  "Qualified",
  "Discussing",
  "Proposal sent",
  "Negotiating",
  "Won",
];

export function CsExpansionTab({ workspace }: TabProps) {
  const { expansionOpportunities, crossSellRecommendations, gates } = workspace;

  const stageCounts = EXPANSION_STAGES.map((stage) => ({
    stage,
    count: expansionOpportunities.filter((opp) => opp.stage === stage).length,
    value: expansionOpportunities.filter((opp) => opp.stage === stage).reduce((sum, opp) => sum + opp.value, 0),
  }));

  return (
    <LifecycleGate available={gates.expansion.available} message={gates.expansion.message}>
      <div className="space-y-4">
        <MarketAnalysisSection title="Expansion Funnel" emphasis="primary" compact>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {stageCounts.map(({ stage, count, value }) => (
              <div key={stage} className="rounded-md border px-2 py-2 text-center text-xs">
                <p className="font-medium">{stage}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{count}</p>
                <p className="text-muted-foreground">{formatCurrency(value)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {expansionOpportunities.map((opp) => (
              <div key={opp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{opp.label}</p>
                  <p className="text-xs text-muted-foreground">{opp.stage} · Close: {opp.expectedCloseDate}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">{formatCurrency(opp.value)}</p>
                  <p className="text-muted-foreground">{formatPercent(opp.probability)} probability</p>
                </div>
              </div>
            ))}
          </div>
        </MarketAnalysisSection>

        <MarketAnalysisSection title="Cross-Sell Recommendations" emphasis="secondary" compact>
          <div className="grid gap-3 lg:grid-cols-2">
            {crossSellRecommendations.map((rec) => (
              <div key={rec.id} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">{rec.title}</p>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
                <p className="mt-1 text-xs font-semibold text-primary">{formatCurrency(rec.estimatedRevenue)} impact</p>
              </div>
            ))}
          </div>
        </MarketAnalysisSection>
      </div>
    </LifecycleGate>
  );
}

export function CsTicketsTab({ workspace }: TabProps) {
  const { ticketKpis, supportCategories } = workspace;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Open tickets" value={String(ticketKpis.openTickets)} />
        <KpiCard label="Closed tickets" value={String(ticketKpis.closedTickets)} />
        <KpiCard label="SLA adherence" value={formatPercent(ticketKpis.slaAdherence)} />
        <KpiCard label="Avg resolution" value={`${ticketKpis.avgResolutionHours}h`} />
        <KpiCard label="Escalation rate" value={formatPercent(ticketKpis.escalationRate)} />
        <KpiCard label="CSAT" value={ticketKpis.csat.toFixed(1)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ticket trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Sparkline data={ticketKpis.monthlyTrend} width={400} height={48} />
        </CardContent>
      </Card>

      <MarketAnalysisSection title="Support Breakdown" emphasis="secondary" compact>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Volume</th>
                <th className="pb-2 pr-4">Resolution time</th>
                <th className="pb-2">Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {supportCategories.map((cat) => (
                <tr key={cat.category} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">{cat.category}</td>
                  <td className="py-2 pr-4 tabular-nums">{cat.volume}</td>
                  <td className="py-2 pr-4 tabular-nums">{cat.resolutionHours}h</td>
                  <td className="py-2 tabular-nums">{cat.satisfaction.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketAnalysisSection>
    </div>
  );
}

export function CsActionsTab({ workspace }: TabProps) {
  const { actions } = workspace;

  return (
    <MarketAnalysisSection title="Recommended Actions" subtitle="Retain, grow, rescue, and expand" emphasis="primary" compact>
      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.id} className="flex flex-wrap items-start justify-between gap-3 rounded-md border px-3 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={action.priority === "high" ? "destructive" : action.priority === "medium" ? "warning" : "secondary"}>
                  {action.priority}
                </Badge>
                <span className="font-medium">{action.action}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{action.expectedImpact}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{action.owner}</p>
              <p>Due {action.dueDate}</p>
            </div>
          </div>
        ))}
      </div>
    </MarketAnalysisSection>
  );
}
