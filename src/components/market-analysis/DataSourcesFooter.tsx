import { AlertCircle } from "lucide-react";
import type { DataQualityWarning } from "@/types/marketAnalysis";

interface DataSourcesFooterProps {
  lastUpdated: string;
  dataSources: string[];
  warnings: DataQualityWarning[];
}

export function DataSourcesFooter({
  lastUpdated,
  dataSources,
  warnings,
}: DataSourcesFooterProps) {
  const formatted = new Date(lastUpdated).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <footer className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">Last updated:</span> {formatted}
      </p>
      <div>
        <p className="font-medium text-foreground">Data sources</p>
        <ul className="mt-1 list-inside list-disc text-muted-foreground">
          {dataSources.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </div>
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((warning) => (
            <p
              key={warning.id}
              className="flex items-start gap-2 text-xs text-amber-800"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {warning.message}
            </p>
          ))}
        </div>
      )}
    </footer>
  );
}
