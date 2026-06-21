import { Link } from "react-router-dom";
import type { MSA } from "@/types/msa";
import { MsaStatusBadge } from "@/components/MsaStatusBadge";
import { formatCurrency } from "@/utils/format";
import { formatPartnerRetention } from "@/utils/msaMetrics";
import { cn } from "@/utils/cn";

interface MarketSummaryCardProps {
  msa: MSA;
  className?: string;
}

export function MarketSummaryCard({ msa, className }: MarketSummaryCardProps) {
  return (
    <Link
      to={`/msa/${msa.id}`}
      className={cn(
        "group block rounded-lg bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/60",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {msa.name}
        </p>
        <MsaStatusBadge status={msa.status} className="scale-[0.85]" />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>
          Revenue:{" "}
          <span className="font-medium text-foreground">{formatCurrency(msa.revenue)}</span>
        </span>
        <span>
          Strength:{" "}
          <span className="font-medium text-foreground">{msa.healthScore}</span>
        </span>
        <span>
          Retention:{" "}
          <span className="font-medium text-foreground">
            {formatPartnerRetention(msa.churnRate)}
          </span>
        </span>
      </div>
    </Link>
  );
}
