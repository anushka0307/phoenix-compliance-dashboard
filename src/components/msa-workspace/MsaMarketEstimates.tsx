import { Info } from "lucide-react";
import type { MsaMarketEstimates } from "@/types/msaWorkspace";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/utils/format";

const METHODOLOGY =
  "Estimates derive from CBSA population using standard penetration assumptions: Patients = Population × 1%; Physician Groups = Patients × 10%; Physicians = Physician Groups × 50%; Home Health Agencies = Population × 1%. Market Penetration compares active patients to total population.";

interface MsaMarketEstimatesProps {
  estimates: MsaMarketEstimates;
}

export function MsaMarketEstimatesSection({ estimates }: MsaMarketEstimatesProps) {
  const rows = [
    { label: "Population", value: formatNumber(estimates.population) },
    { label: "Estimated Patients", value: formatNumber(estimates.estimatedPatients) },
    { label: "Estimated PGs", value: formatNumber(estimates.estimatedPhysicianGroups) },
    { label: "Estimated Physicians", value: formatNumber(estimates.estimatedPhysicians) },
    { label: "Estimated HHAs", value: formatNumber(estimates.estimatedHhas) },
    { label: "Market Penetration", value: formatPercent(estimates.marketPenetration) },
  ];

  return (
    <section aria-label="Market estimates" className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Market Estimates</h2>
          <p className="text-sm text-muted-foreground">Derived from CBSA population assumptions</p>
        </div>
        <button
          type="button"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Estimation methodology"
          title={METHODOLOGY}
        >
          <Info className="size-4" aria-hidden />
        </button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="grid gap-0 divide-y divide-border p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-lg font-semibold tabular-nums text-foreground">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
