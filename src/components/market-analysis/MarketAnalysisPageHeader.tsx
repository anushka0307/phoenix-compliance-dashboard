import type { MSA } from "@/types/msa";
import { MsaStatusBadge } from "@/components/MsaStatusBadge";

interface MarketAnalysisPageHeaderProps {
  msa: MSA;
}

export function MarketAnalysisPageHeader({ msa }: MarketAnalysisPageHeaderProps) {
  return (
    <header className="space-y-1 border-b border-border pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Market Analysis
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">{msa.name}</h1>
        <MsaStatusBadge status={msa.status} compact />
      </div>
    </header>
  );
}
