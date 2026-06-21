import { Link, Outlet, Navigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMsa } from "@/hooks/useMsa";
import { usePortfolio } from "@/contexts/NetworkContext";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { MsaOverviewHeader } from "@/components/msa-workspace/MsaOverviewHeader";

export function MsaWorkspaceLayout() {
  const { msa, msaId } = useMsa();
  const { onboardingMsaId } = usePortfolio();
  const location = useLocation();
  const isOverview = location.pathname === `/msa/${msaId}` || location.pathname === `/msa/${msaId}/`;
  const showOnboarding = msa && onboardingMsaId === msa.id && msa.onboardingStatus === "pending";

  if (!msaId) {
    return <Navigate to="/" replace />;
  }

  if (!msa) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold">Market not found</p>
        <p className="text-sm text-muted-foreground">
          The selected MSA does not exist in the current network.
        </p>
      </div>
    );
  }

  const isInactiveMarket = msa.status === "inactive";
  if (isInactiveMarket && !isOverview) {
    return <Navigate to={`/msa/${msaId}`} replace />;
  }

  return (
    <div className="space-y-6">
      {showOnboarding && <OnboardingBanner msa={msa} />}

      {!isOverview && (
        <div className="space-y-4">
          <Link
            to={`/msa/${msaId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to overview
          </Link>
          <MsaOverviewHeader msa={msa} />
        </div>
      )}

      <Outlet />
    </div>
  );
}
