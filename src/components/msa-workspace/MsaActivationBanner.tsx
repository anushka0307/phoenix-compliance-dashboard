import { MapPinPlus } from "lucide-react";
import type { MSA } from "@/types/msa";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/utils/format";

interface MsaActivationBannerProps {
  msa: MSA;
}

export function MsaActivationBanner({ msa }: MsaActivationBannerProps) {
  const { openActivation } = useMsaNavigation();

  if (msa.status !== "inactive") return null;

  return (
    <Card className="flex flex-col gap-4 border-dashed border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPinPlus className="size-4 text-primary" />
          Market not yet activated
        </p>
        <p className="text-sm text-muted-foreground">
          {msa.name} has an estimated population of {formatNumber(msa.population)}. Review market
          estimates below, then activate to begin onboarding physician groups and home health
          agencies.
        </p>
      </div>
      <Button type="button" className="shrink-0" onClick={() => openActivation(msa)}>
        Activate Market
      </Button>
    </Card>
  );
}
