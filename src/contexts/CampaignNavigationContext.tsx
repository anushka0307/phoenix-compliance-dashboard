import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CampaignLaunchContext } from "@/types/acquisitionCampaign";

interface CampaignNavigationContextValue {
  launchContext: CampaignLaunchContext | null;
  duplicateFromCampaignId: string | null;
  openCampaignWizard: (context: CampaignLaunchContext, duplicateCampaignId?: string) => void;
  closeCampaignWizard: () => void;
}

const CampaignNavigationContext = createContext<CampaignNavigationContextValue | null>(null);

export function CampaignNavigationProvider({ children }: { children: ReactNode }) {
  const [launchContext, setLaunchContext] = useState<CampaignLaunchContext | null>(null);
  const [duplicateFromCampaignId, setDuplicateFromCampaignId] = useState<string | null>(null);

  const openCampaignWizard = useCallback(
    (context: CampaignLaunchContext, duplicateCampaignId?: string) => {
      setLaunchContext(context);
      setDuplicateFromCampaignId(duplicateCampaignId ?? null);
    },
    [],
  );

  const closeCampaignWizard = useCallback(() => {
    setLaunchContext(null);
    setDuplicateFromCampaignId(null);
  }, []);

  const value = useMemo(
    () => ({
      launchContext,
      duplicateFromCampaignId,
      openCampaignWizard,
      closeCampaignWizard,
    }),
    [launchContext, duplicateFromCampaignId, openCampaignWizard, closeCampaignWizard],
  );

  return (
    <CampaignNavigationContext.Provider value={value}>{children}</CampaignNavigationContext.Provider>
  );
}

export function useCampaignNavigation() {
  const context = useContext(CampaignNavigationContext);
  if (!context) {
    throw new Error("useCampaignNavigation must be used within CampaignNavigationProvider");
  }
  return context;
}

export function useOptionalCampaignNavigation() {
  return useContext(CampaignNavigationContext);
}
