import { useEffect, useState } from "react";
import type { DashboardPeriod } from "@/types/msa";
import { useNetwork } from "@/contexts/NetworkContext";
import {
  formatDateRangeDisplay,
  formatLastUpdated,
  getDateRangeLabel,
  validateCustomDateRange,
} from "@/utils/dateRangeHelpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

const PRESETS: { value: DashboardPeriod; label: string }[] = [
  { value: "overall", label: "Overall" },
  { value: "30d", label: "Last 30 Days" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom Range" },
];

export function DashboardTimeFilter({ className }: { className?: string }) {
  const {
    dateRange,
    lastUpdated,
    setPreset,
    applyCustomRange,
    clearCustomRange,
  } = useNetwork();

  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(dateRange.start);
  const [draftEnd, setDraftEnd] = useState(dateRange.end);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDraftStart(dateRange.start);
    setDraftEnd(dateRange.end);
  }, [dateRange.start, dateRange.end]);

  const handlePreset = (preset: DashboardPeriod) => {
    if (preset === "custom") {
      setDraftStart(dateRange.start);
      setDraftEnd(dateRange.end);
      setValidationError(null);
      setCustomOpen(true);
      return;
    }
    setPreset(preset);
  };

  const handleApplyCustom = () => {
    const validation = validateCustomDateRange(draftStart, draftEnd);
    if (!validation.valid) {
      setValidationError(validation.message ?? "Invalid date range.");
      return;
    }

    const applied = applyCustomRange(draftStart, draftEnd);
    if (applied) {
      setValidationError(null);
      setCustomOpen(false);
    }
  };

  const handleClearCustom = () => {
    clearCustomRange();
    setValidationError(null);
    setCustomOpen(false);
  };

  const activeRangeLabel =
    dateRange.preset === "custom"
      ? formatDateRangeDisplay(dateRange)
      : getDateRangeLabel(dateRange);

  return (
    <>
      <div className={cn("flex flex-col items-end gap-2", className)}>
        <div className="flex flex-wrap items-center justify-end gap-1 rounded-lg border border-border bg-card p-1">
          {PRESETS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handlePreset(option.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                dateRange.preset === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <p>{activeRangeLabel}</p>
          <p>Last updated: {formatLastUpdated(lastUpdated)}</p>
        </div>
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Date Range</DialogTitle>
            <DialogDescription>
              Select a start and end date to filter dashboard metrics.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Start Date</span>
              <input
                type="date"
                value={draftStart}
                onChange={(event) => setDraftStart(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground">End Date</span>
              <input
                type="date"
                value={draftEnd}
                onChange={(event) => setDraftEnd(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClearCustom}>
                Reset
              </Button>
              <Button type="button" onClick={handleApplyCustom}>
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
