import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { useMsa } from "@/hooks/useMsa";
import { useCampaignNavigation } from "@/contexts/CampaignNavigationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPgAcquisitionWorkspaceWithCampaigns } from "@/utils/pgCampaignBridge";
import {
  buildLaunchContextFromMsa,
  canLaunchCampaign,
  getCampaignsForMsa,
} from "@/utils/acquisitionCampaignStore";
import { getObjectiveLabel, getCampaignTypeLabel } from "@/types/acquisitionCampaign";
import { formatCurrency } from "@/utils/format";
import { useMemo } from "react";

export function CampaignListPage() {
  const { msa } = useMsa();
  const { openCampaignWizard } = useCampaignNavigation();

  const campaigns = useMemo(() => {
    if (!msa) return [];
    getPgAcquisitionWorkspaceWithCampaigns(msa);
    return getCampaignsForMsa(msa.id);
  }, [msa]);

  if (!msa) return null;

  const canCreate = canLaunchCampaign(msa);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Acquisition Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            Generate, nurture, and convert physician groups in {msa.name}
          </p>
        </div>
        <Button
          disabled={!canCreate}
          onClick={() => openCampaignWizard(buildLaunchContextFromMsa(msa, { source: "pg-acquisition" }))}
        >
          <Megaphone className="mr-2 size-4" />
          Create Acquisition Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No campaigns yet. Create a campaign to drive PG movement through the acquisition funnel.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{campaign.name}</CardTitle>
                  <Badge variant="outline">{campaign.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  {getObjectiveLabel(campaign.objective)} · {getCampaignTypeLabel(campaign.type)}
                </p>
                <p className="text-xs">
                  {campaign.kpis.targetPgs} targets · {formatCurrency(campaign.kpis.revenueInfluenced)} influenced
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/msa/${msa.id}/campaigns/${campaign.id}`}>View dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
