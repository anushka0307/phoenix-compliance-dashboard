import { useNetwork } from "@/contexts/NetworkContext";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

export function ActivationToast() {
  const { activationToast } = useNetwork();

  if (!activationToast) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-lg",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">🎉 New client onboarded</p>
        <p className="text-sm text-foreground">{activationToast.msaName} activated successfully.</p>
        <p className="text-xs text-muted-foreground">
          Estimated annual revenue: {formatCurrency(activationToast.estimatedRevenue)}
        </p>
        <p className="text-xs text-muted-foreground">
          Network coverage expanded to {activationToast.totalMsas} MSAs.
        </p>
      </div>
    </div>
  );
}
