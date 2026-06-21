import type { MSA } from "@/types/msa";
import type { MarketRecommendation } from "@/types/marketAnalysis";
import { useOptionalCampaignNavigation } from "@/contexts/CampaignNavigationContext";
import { buildLaunchContextFromRecommendation } from "@/utils/acquisitionCampaignStore";
import { Button } from "@/components/ui/button";
import { MarketAnalysisSection } from "@/components/market-analysis/MarketAnalysisSection";
import { maGrid } from "@/components/market-analysis/marketAnalysisLayout";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

interface RecommendationsSectionProps {
  recommendations: MarketRecommendation[];
  msa: MSA;
}

export function RecommendationsSection({ recommendations, msa }: RecommendationsSectionProps) {
  const campaignNav = useOptionalCampaignNavigation();
  return (
    <MarketAnalysisSection
      title="Recommended Actions"
      subtitle="What to do and how to execute — with owners, resources, and next steps"
      emphasis="primary"
      compact
    >
      <div className={cn("grid lg:grid-cols-2 xl:grid-cols-3", maGrid)}>
        {recommendations.map((item, index) => (
          <article
            key={item.id}
            className="flex flex-col rounded-lg border border-primary/15 bg-background/80 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                Priority {index + 1}
              </p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{item.action}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
            <dl className="mt-3 flex-1 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Expected impact</dt>
                <dd className="mt-0.5 text-foreground">{item.expectedImpact}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Revenue impact</dt>
                <dd className="mt-0.5 font-semibold">{formatCurrency(item.revenueImpact)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Owner · Timeline</dt>
                <dd className="mt-0.5 text-foreground">
                  {item.owner} · {item.dueDate}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Resources</dt>
                <dd className="mt-0.5 text-foreground">{item.requiredResources}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Next steps</dt>
                <dd className="mt-0.5">
                  <ol className="list-decimal space-y-0.5 pl-4 text-xs text-foreground">
                    {item.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </dd>
              </div>
            </dl>
            <Button
              className="mt-3 w-full"
              size="sm"
              variant="outline"
              onClick={() =>
                campaignNav?.openCampaignWizard(buildLaunchContextFromRecommendation(msa, item))
              }
            >
              Create Acquisition Campaign
            </Button>
          </article>
        ))}
      </div>
    </MarketAnalysisSection>
  );
}
