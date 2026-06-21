import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Building2, HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MsaOperatingFunctionKpi } from "@/types/msaWorkspace";
import { formatPercent } from "@/utils/format";

interface MsaOperatingFunctionsProps {
  msaId: string;
  kpis: MsaOperatingFunctionKpi;
}

export function MsaOperatingFunctions({ msaId, kpis }: MsaOperatingFunctionsProps) {
  const cards = [
    {
      icon: BarChart3,
      title: "Market Analysis",
      description: "Understand demand, competition, and expansion potential.",
      kpiLabel: "Opportunity Score",
      kpiValue: String(kpis.opportunityScore),
      href: `/msa/${msaId}/market-analysis`,
      cta: "View Analysis",
    },
    {
      icon: Building2,
      title: "PG Acquisition",
      description: "Review funnel performance, conversions, and onboarding.",
      kpiLabel: "Qualified PG Conversion",
      kpiValue: formatPercent(kpis.conversionRate),
      href: `/msa/${msaId}/pg-acquisition`,
      cta: "Open Funnel",
    },
    {
      icon: HeartHandshake,
      title: "Customer Success",
      description: "Monitor retention, utilization, and partner health.",
      kpiLabel: "Partner Retention",
      kpiValue: formatPercent(kpis.partnerRetention),
      href: `/msa/${msaId}/customer-success`,
      cta: "Review Health",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="shadow-sm">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <card.icon className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{card.kpiLabel}</p>
              <p className="text-2xl font-semibold tabular-nums">{card.kpiValue}</p>
            </div>
            <Button variant="outline" className="mt-auto w-full justify-between" asChild>
              <Link to={card.href}>
                {card.cta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
