import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsaActivityItem } from "@/types/msaWorkspace";

interface MsaRecentActivityProps {
  activities: MsaActivityItem[];
}

export function MsaRecentActivity({ activities }: MsaRecentActivityProps) {
  const grouped = activities.reduce<Record<string, MsaActivityItem[]>>((acc, item) => {
    acc[item.period] = acc[item.period] ?? [];
    acc[item.period].push(item);
    return acc;
  }, {});

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(grouped).map(([period, items]) => (
          <div key={period}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {period}
            </p>
            <ul className="mt-2 space-y-1.5">
              {items.map((item) => (
                <li key={item.id} className="text-sm text-muted-foreground">
                  • {item.message}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
