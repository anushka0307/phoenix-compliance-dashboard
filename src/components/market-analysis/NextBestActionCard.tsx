import { Target } from "lucide-react";
import type { MSA } from "@/types/msa";
import type { PgAcquisitionFocus } from "@/types/marketAnalysis";
import { useOptionalCampaignNavigation } from "@/contexts/CampaignNavigationContext";
import { buildLaunchContextFromFocus } from "@/utils/acquisitionCampaignStore";
import { Button } from "@/components/ui/button";

interface NextBestActionCardProps {
  focus: PgAcquisitionFocus;
  msa: MSA;
  variant?: "sidebar" | "footer";
}

export function NextBestActionCard({ focus, msa, variant = "sidebar" }: NextBestActionCardProps) {
  const campaignNav = useOptionalCampaignNavigation();
  const isSidebar = variant === "sidebar";

  return (
    <aside
      className={
        isSidebar
          ? "xl:sticky xl:top-20 z-20 w-full shrink-0 xl:w-72"
          : "fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-lg xl:hidden"
      }
    >
      <div className="rounded-xl border border-emerald-300/80 bg-emerald-50/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-emerald-50/90">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Target className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              Next Best Action
            </p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-950">
              Acquire {focus.targetPg}
            </p>
            <p className="text-xs text-emerald-800/80">{focus.county}</p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900/90">{focus.rationale}</p>
          </div>
        </div>
        <Button
          className="mt-3 w-full"
          size="sm"
          variant="default"
          onClick={() => campaignNav?.openCampaignWizard(buildLaunchContextFromFocus(msa, focus))}
        >
          Create Acquisition Campaign
        </Button>
      </div>
    </aside>
  );
}
