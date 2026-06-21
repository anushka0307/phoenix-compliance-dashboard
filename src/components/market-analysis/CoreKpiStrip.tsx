import { METRIC_DEFINITIONS } from "@/data/metricDefinitions";
import { MetricTooltip } from "@/components/market-analysis/MetricTooltip";
import type { CoreMarketKpis } from "@/types/marketAnalysis";
import { formatPercent } from "@/utils/format";

interface CoreKpiStripProps {
  kpis: CoreMarketKpis;
}

const KPI_ITEMS: {
  key: keyof CoreMarketKpis;
  label: string;
  metricKey: keyof typeof METRIC_DEFINITIONS;
  format: (v: number) => string;
}[] = [
  { key: "opportunityScore", label: "Opportunity", metricKey: "opportunityScore", format: String },
  { key: "pgPenetration", label: "PG Penetration", metricKey: "pgPenetration", format: formatPercent },
  { key: "patientReach", label: "Patient Reach", metricKey: "patientReach", format: formatPercent },
  { key: "zipCoverage", label: "ZIP Coverage", metricKey: "zipCoverage", format: formatPercent },
  { key: "referralCoverage", label: "Referral Coverage", metricKey: "referralCoverage", format: formatPercent },
];

export function CoreKpiStrip({ kpis }: CoreKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-3 lg:grid-cols-5">
      {KPI_ITEMS.map((item) => (
        <div key={item.key} className="rounded-md bg-background px-3 py-2">
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <MetricTooltip metric={METRIC_DEFINITIONS[item.metricKey]} />
          </div>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {item.format(kpis[item.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
