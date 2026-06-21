import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useNetwork } from "@/contexts/NetworkContext";
import { useOptionalCampaignNavigation } from "@/contexts/CampaignNavigationContext";
import { getMsaById } from "@/data/mockMsas";
import { buildLaunchContextFromMsa, canLaunchCampaign } from "@/utils/acquisitionCampaignStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNetworkRecommendations } from "@/utils/networkAnalytics";

interface RecommendedActionsCardProps {
  title?: string;
}

export function RecommendedActionsCard({ title = "Expansion Recommendations" }: RecommendedActionsCardProps) {
  const { dashboardMsas } = useNetwork();
  const campaignNav = useOptionalCampaignNavigation();
  const recommendations = getNetworkRecommendations(dashboardMsas);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {recommendations.map((item) => {
            const msaMatch = item.href.match(/^\/msa\/([^/]+)/);
            const msa = msaMatch ? getMsaById(dashboardMsas, msaMatch[1]) : undefined;
            const canCampaign = msa && canLaunchCampaign(msa) && item.href.includes("pg-acquisition");

            return (
            <li key={item.id} className="space-y-1">
              <Link
                to={item.href}
                className="group flex items-start justify-between gap-2 text-sm"
              >
                <span>
                  <span className="font-medium text-foreground">{item.priority}. </span>
                  <span className="text-foreground">{item.action}</span>
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
              {canCampaign && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 text-xs text-primary"
                  onClick={() =>
                    campaignNav?.openCampaignWizard(
                      buildLaunchContextFromMsa(msa, {
                        source: "executive",
                        recommendationAction: item.action,
                      }),
                    )
                  }
                >
                  Create Acquisition Campaign
                </Button>
              )}
            </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
