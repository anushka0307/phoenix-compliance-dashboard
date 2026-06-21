import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsaWorkspaceInsight } from "@/types/msaWorkspace";
import { cn } from "@/utils/cn";

const severityDot = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
} as const;

interface InsightListCardProps {
  title: string;
  items: MsaWorkspaceInsight[];
}

function InsightListCard({ title, items }: InsightListCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              <span
                className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", severityDot[item.severity])}
              />
              <span className="text-muted-foreground">{item.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface MsaInsightsGridProps {
  opportunities: MsaWorkspaceInsight[];
  risks: MsaWorkspaceInsight[];
}

export function MsaInsightsGrid({ opportunities, risks }: MsaInsightsGridProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InsightListCard title="Market Opportunities" items={opportunities} />
      <InsightListCard title="Market Risks" items={risks} />
    </div>
  );
}
