import { Link } from "react-router-dom";
import type { MSA } from "@/types/msa";
import { usePortfolio } from "@/contexts/NetworkContext";
import { Button } from "@/components/ui/button";

interface OnboardingBannerProps {
  msa: MSA;
}

export function OnboardingBanner({ msa }: OnboardingBannerProps) {
  const { dismissOnboarding } = usePortfolio();

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Welcome to {msa.name}</p>
          <p className="text-sm text-muted-foreground">
            Complete setup to begin tracking operating functions:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              <Link to={`/msa/${msa.id}/market-analysis`} className="hover:text-primary">
                □ Market Analysis
              </Link>
            </li>
            <li>
              <Link to={`/msa/${msa.id}/pg-acquisition`} className="hover:text-primary">
                □ PG Acquisition Pipeline
              </Link>
            </li>
            <li>
              <Link to={`/msa/${msa.id}/customer-success`} className="hover:text-primary">
                □ Customer Success Metrics
              </Link>
            </li>
          </ul>
        </div>
        <Button variant="outline" size="sm" onClick={dismissOnboarding} className="shrink-0">
          Dismiss
        </Button>
      </div>
    </div>
  );
}
