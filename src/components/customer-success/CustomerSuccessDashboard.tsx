import { useMemo, useState } from "react";
import type { MSA } from "@/types/msa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerSuccessHeader } from "@/components/customer-success/CustomerSuccessHeader";
import {
  CsActionsTab,
  CsExpansionTab,
  CsOverviewTab,
  CsRapportTab,
  CsTicketsTab,
  CsValueCommunicationTab,
  CsValueFulfilmentTab,
} from "@/components/customer-success/CustomerSuccessTabPanels";
import {
  buildCustomerSuccessWorkspace,
  getCustomerSuccessEmptyState,
} from "@/utils/customerSuccessWorkspace";
import { cn } from "@/utils/cn";

interface CustomerSuccessDashboardProps {
  msa: MSA;
}

export function CustomerSuccessDashboard({ msa }: CustomerSuccessDashboardProps) {
  const [selectedPgId, setSelectedPgId] = useState<string | undefined>();

  const workspace = useMemo(
    () => buildCustomerSuccessWorkspace(msa, selectedPgId),
    [msa, selectedPgId],
  );

  if (!workspace) {
    const empty = getCustomerSuccessEmptyState(msa);
    if (empty) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">{empty.title}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{empty.message}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Customer success data is being prepared for this account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {workspace.accounts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {workspace.accounts.map((account) => (
            <button
              key={account.pgId}
              type="button"
              onClick={() => setSelectedPgId(account.pgId)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                workspace.selectedPgId === account.pgId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {account.pgName}
            </button>
          ))}
        </div>
      )}

      <CustomerSuccessHeader header={workspace.header} topKpis={workspace.topKpis} />

      <Tabs defaultValue="overview">
        <TabsList className="mb-3 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="value">Value Fulfilment</TabsTrigger>
          <TabsTrigger value="communication">Value Communication</TabsTrigger>
          <TabsTrigger value="rapport">Rapport & Account Map</TabsTrigger>
          <TabsTrigger value="expansion">Expansion Opportunities</TabsTrigger>
          <TabsTrigger value="tickets">Tickets & Support</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CsOverviewTab workspace={workspace} />
        </TabsContent>
        <TabsContent value="value">
          <CsValueFulfilmentTab workspace={workspace} />
        </TabsContent>
        <TabsContent value="communication">
          <CsValueCommunicationTab workspace={workspace} />
        </TabsContent>
        <TabsContent value="rapport">
          <CsRapportTab workspace={workspace} />
        </TabsContent>
        <TabsContent value="expansion">
          <CsExpansionTab workspace={workspace} />
        </TabsContent>
        <TabsContent value="tickets">
          <CsTicketsTab workspace={workspace} />
        </TabsContent>
        <TabsContent value="actions">
          <CsActionsTab workspace={workspace} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
