import { cn } from "@/utils/cn";
import {
  AVAILABLE_AFTER_ONBOARDING_LABEL,
  INSUFFICIENT_DATA_LABEL,
} from "@/utils/marketOperationalReadiness";

interface InsufficientDataPanelProps {
  label?: string;
  description?: string;
  reasons?: string[];
  className?: string;
}

export function InsufficientDataPanel({
  label = INSUFFICIENT_DATA_LABEL,
  description = AVAILABLE_AFTER_ONBOARDING_LABEL,
  reasons,
  className,
}: InsufficientDataPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {reasons && reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
