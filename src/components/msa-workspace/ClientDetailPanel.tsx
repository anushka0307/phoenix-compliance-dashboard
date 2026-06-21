import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MsaClient } from "@/types/msaWorkspace";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { clientMarkerColor } from "@/utils/msaWorkspaceHelpers";

interface ClientDetailPanelProps {
  client: MsaClient | null;
  onClose: () => void;
}

export function ClientDetailPanel({ client, onClose }: ClientDetailPanelProps) {
  if (!client) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">{client.name}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Client operating profile</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Patients</dt>
            <dd className="font-semibold tabular-nums">{formatNumber(client.patients)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Annual Revenue</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(client.revenue)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Retention</dt>
            <dd className="font-semibold tabular-nums">{formatPercent(client.retention)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Home Health Agencies</dt>
            <dd className="font-semibold tabular-nums">{client.homeHealthAgencies}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Health Status</dt>
            <dd className="flex items-center gap-2 font-medium">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: clientMarkerColor(client.health) }}
              />
              {client.health === "healthy"
                ? "Healthy"
                : client.health === "attention"
                  ? "Needs attention"
                  : "At risk"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
