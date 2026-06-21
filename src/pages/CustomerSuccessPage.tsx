import { HeartHandshake } from "lucide-react";
import { useMsa } from "@/hooks/useMsa";
import { CustomerSuccessDashboard } from "@/components/customer-success/CustomerSuccessDashboard";

export function CustomerSuccessPage() {
  const { msa } = useMsa();

  if (!msa) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HeartHandshake className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Customer Success</h2>
          <p className="text-sm text-muted-foreground">
            Value delivery and relationship health for onboarded physician groups
          </p>
        </div>
      </div>

      <CustomerSuccessDashboard msa={msa} />
    </div>
  );
}
