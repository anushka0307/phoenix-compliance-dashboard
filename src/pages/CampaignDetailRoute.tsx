import { useParams } from "react-router-dom";
import { CampaignDetailPage } from "@/pages/CampaignDetailPage";

export function CampaignDetailRoute() {
  const { campaignId } = useParams<{ campaignId: string }>();
  if (!campaignId) return null;
  return <CampaignDetailPage campaignId={campaignId} />;
}
