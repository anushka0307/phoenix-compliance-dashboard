import { ArrowRight, BarChart3, HeartHandshake, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface NavCard {
  title: string;
  description: string;
  cta: string;
  path: string;
  icon: LucideIcon;
}

interface MsaFunctionalNavProps {
  msaId: string;
}

const NAV_CARDS: Omit<NavCard, "path">[] = [
  {
    title: "Market Analysis",
    description:
      "Assess market attractiveness, competition, coverage gaps, and expansion opportunities.",
    cta: "Open Market Analysis →",
    icon: BarChart3,
  },
  {
    title: "PG Acquisition",
    description:
      "Track physician group sourcing, qualification, conversion, and onboarding.",
    cta: "Open PG Acquisition →",
    icon: UserPlus,
  },
  {
    title: "Customer Success",
    description:
      "Monitor partner health, retention, tickets, and operational performance.",
    cta: "Open Customer Success →",
    icon: HeartHandshake,
  },
];

const PATHS = ["market-analysis", "pg-acquisition", "customer-success"] as const;

export function MsaFunctionalNav({ msaId }: MsaFunctionalNavProps) {
  return (
    <section aria-label="Functional navigation" className="space-y-3">
      <div className="sr-only">
        <h2>Operating functions</h2>
      </div>
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {NAV_CARDS.map((card, index) => {
          const Icon = card.icon;
          const to = `/msa/${msaId}/${PATHS[index]}`;

          return (
            <Link
              key={card.title}
              to={to}
              className={cn(
                "group block rounded-xl outline-none transition-all",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:-translate-y-0.5 hover:shadow-md",
              )}
            >
              <Card className="h-full border-border shadow-sm transition-shadow group-hover:border-primary/30 group-hover:shadow-lg">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {card.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
