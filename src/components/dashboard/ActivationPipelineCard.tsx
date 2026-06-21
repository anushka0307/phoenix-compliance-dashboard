import { useNetwork, type SidebarMarketFilter } from "@/contexts/NetworkContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivationPipelineSummary } from "@/utils/networkAnalytics";
import { cn } from "@/utils/cn";

const PIPELINE_ITEMS: {
  key: SidebarMarketFilter;
  label: string;
  getCount: (summary: ReturnType<typeof getActivationPipelineSummary>) => number;
}[] = [
  { key: "inactive", label: "Inactive Markets", getCount: (s) => s.inactive },
  { key: "ready", label: "Ready for Activation", getCount: (s) => s.ready },
  { key: "evaluation", label: "Under Evaluation", getCount: (s) => s.evaluation },
  { key: "blocked", label: "Blocked", getCount: (s) => s.blocked },
];

export function ActivationPipelineCard() {
  const { msas, sidebarFilter, setSidebarFilter } = useNetwork();
  const summary = getActivationPipelineSummary(msas);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Market Activation Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {PIPELINE_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSidebarFilter(item.key)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              sidebarFilter === item.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span>{item.label}</span>
            <span className="font-semibold tabular-nums">{item.getCount(summary)}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
