import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import type { AlertSentiment, OperationalAlert } from "@/types/marketAnalysis";
import { cn } from "@/utils/cn";

interface AlertCenterSectionProps {
  alerts: OperationalAlert[];
}

const sentimentStyles: Record<
  AlertSentiment,
  { container: string; icon: typeof AlertTriangle; iconClass: string }
> = {
  positive: {
    container: "border-emerald-200 bg-emerald-50/60",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/50",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
  },
  negative: {
    container: "border-red-200 bg-red-50/60",
    icon: AlertTriangle,
    iconClass: "text-red-600",
  },
  neutral: {
    container: "border-border bg-muted/30",
    icon: Info,
    iconClass: "text-muted-foreground",
  },
};

export function AlertCenterSection({ alerts }: AlertCenterSectionProps) {
  return (
    <MarketAnalysisSection
      title="Alert Center"
      subtitle="Operational signals sorted by sentiment and priority"
      emphasis="primary"
    >
      <ul className="space-y-2">
        {alerts.map((alert) => {
          const style = sentimentStyles[alert.sentiment];
          const Icon = style.icon;
          return (
            <li
              key={alert.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
                style.container,
              )}
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", style.iconClass)} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{alert.message}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </MarketAnalysisSection>
  );
}
