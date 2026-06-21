import { Link, Navigate } from "react-router-dom";
import { useMsa } from "@/hooks/useMsa";
import { CampaignDetailDashboard } from "@/components/acquisition-campaign/CampaignDetailDashboard";
import { getCampaignById } from "@/utils/acquisitionCampaignStore";

interface CampaignDetailPageProps {
  campaignId: string;
}

export function CampaignDetailPage({ campaignId }: CampaignDetailPageProps) {
  const { msa, msaId } = useMsa();
  const campaign = msa ? getCampaignById(msa.id, campaignId) : undefined;

  if (!msaId) return <Navigate to="/" replace />;
  if (!campaign) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Campaign not found.{" "}
        <Link to={`/msa/${msaId}/campaigns`} className="text-primary hover:underline">
          Return to campaigns
        </Link>
      </div>
    );
  }

  return <CampaignDetailDashboard campaign={campaign} msaId={msaId} />;
}
