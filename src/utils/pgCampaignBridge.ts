import type { MSA } from "@/types/msa";
import type { PgAcquisitionWorkspace } from "@/types/pgAcquisition";
import { getAggregateCampaignMetrics, seedCampaignsForMsa } from "@/utils/acquisitionCampaignStore";
import { getPgAcquisitionWorkspace } from "@/utils/pgAcquisitionStore";

/** Load PG workspace and sync campaign seed/metrics without circular store calls. */
export function getPgAcquisitionWorkspaceWithCampaigns(msa: MSA): PgAcquisitionWorkspace {
  const workspace = getPgAcquisitionWorkspace(msa);
  seedCampaignsForMsa(msa, workspace.pgs);

  const aggregate = getAggregateCampaignMetrics(msa.id);
  if (aggregate.activeCampaigns > 0) {
    return { ...workspace, campaigns: aggregate };
  }

  return workspace;
}
