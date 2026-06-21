import { useNetwork } from "@/contexts/NetworkContext";
import { getNetworkInsights } from "@/utils/networkAnalytics";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { NetworkInsight } from "@/utils/networkAnalytics";
import { cn } from "@/utils/cn";

const severityStyles: Record<NetworkInsight["severity"], string> = {
  high: "border-l-red-500 bg-red-50/50",
  medium: "border-l-amber-500 bg-amber-50/40",
  low: "border-l-emerald-500 bg-emerald-50/40",
};

const severityLabel: Record<NetworkInsight["severity"], string> = {
  high: "High priority",
  medium: "Monitor",
  low: "Opportunity",
};

export function ActionableInsights() {
  const { dashboardMsas } = useNetwork();
  const insights = getNetworkInsights(dashboardMsas);

  return (
    <section aria-label="Actionable network insights" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Priority Actions</h2>
        <p className="text-sm text-muted-foreground">
          Issues and opportunities requiring executive decisions
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className={cn(
              "flex flex-col justify-between rounded-xl border-l-4 p-4",
              severityStyles[insight.severity],
            )}
          >
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {severityLabel[insight.severity]}
              </p>
              <p className="text-sm font-semibold leading-snug text-foreground">
                {insight.headline}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{insight.context}</p>
            </div>
            <Link
              to={insight.actionHref}
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {insight.actionLabel}
              <ArrowRight className="size-3" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
