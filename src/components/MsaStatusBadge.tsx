import type { MsaStatus } from "@/types/msa";
import { getMsaStatusLabel, getMsaStatusVariant } from "@/utils/msaStatus";
import { cn } from "@/utils/cn";

const variantStyles: Record<
  ReturnType<typeof getMsaStatusVariant>,
  string
> = {
  growing: "border-transparent bg-emerald-100 text-emerald-800",
  opportunity: "border-transparent bg-amber-100 text-amber-800",
  attention: "border-transparent bg-red-100 text-red-800",
  "new-market": "border-transparent bg-blue-100 text-blue-800",
  inactive: "border-transparent bg-slate-100 text-slate-600",
};

interface MsaStatusBadgeProps {
  status: MsaStatus;
  className?: string;
  compact?: boolean;
}

export function MsaStatusBadge({ status, className, compact }: MsaStatusBadgeProps) {
  const variant = getMsaStatusVariant(status);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-medium",
        variantStyles[variant],
        compact ? "rounded-full px-1.5 py-0 text-[11px] leading-none" : "px-2.5 py-0.5 text-xs",
        className,
      )}
    >
      {getMsaStatusLabel(status)}
    </span>
  );
}
