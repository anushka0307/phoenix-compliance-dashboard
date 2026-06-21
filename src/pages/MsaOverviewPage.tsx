import { useMemo } from "react";
import { useMsa } from "@/hooks/useMsa";
import { MsaActivationBanner } from "@/components/msa-workspace/MsaActivationBanner";
import { MsaFunctionalNav } from "@/components/msa-workspace/MsaFunctionalNav";
import { MsaMarketEstimatesSection } from "@/components/msa-workspace/MsaMarketEstimates";
import { MsaOverviewHeader } from "@/components/msa-workspace/MsaOverviewHeader";
import { MsaOverviewKpis } from "@/components/msa-workspace/MsaOverviewKpis";
import { getMsaMarketEstimates } from "@/utils/msaWorkspaceHelpers";

export function MsaOverviewPage() {
  const { msa } = useMsa();

  const estimates = useMemo(() => (msa ? getMsaMarketEstimates(msa) : null), [msa]);

  if (!msa || !estimates) return null;

  return (
    <div className="space-y-6">
      <MsaOverviewHeader msa={msa} />
      <MsaActivationBanner msa={msa} />
      <MsaOverviewKpis msa={msa} />
      <MsaMarketEstimatesSection estimates={estimates} />
      {msa.status !== "inactive" && <MsaFunctionalNav msaId={msa.id} />}
    </div>
  );
}
