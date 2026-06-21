import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useLocation } from "react-router-dom";
import type { MSA } from "@/types/msa";
import { usePortfolio } from "@/contexts/NetworkContext";
import { getMsaById } from "@/data/mockMsas";
import { useRecentMsas } from "@/hooks/useSidebarState";

interface MsaNavigationContextValue {
  selectedMsaId: string | null;
  hoveredMsaId: string | null;
  setHoveredMsaId: (id: string | null) => void;
  recentMsaIds: string[];
  recordRecentMsa: (id: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  focusSearch: () => void;
  activationMsa: MSA | null;
  openActivation: (msa: MSA) => void;
  closeActivation: () => void;
}

const MsaNavigationContext = createContext<MsaNavigationContextValue | null>(null);

export function MsaNavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [hoveredMsaId, setHoveredMsaId] = useState<string | null>(null);
  const [activationMsa, setActivationMsa] = useState<MSA | null>(null);
  const { recentMsaIds, recordRecentMsa } = useRecentMsas();

  const selectedMsaId = useMemo(() => {
    const match = location.pathname.match(/^\/msa\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, []);

  const openActivation = useCallback((msa: MSA) => {
    setActivationMsa(msa);
  }, []);

  const closeActivation = useCallback(() => {
    setActivationMsa(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedMsaId,
      hoveredMsaId,
      setHoveredMsaId,
      recentMsaIds,
      recordRecentMsa,
      searchInputRef,
      focusSearch,
      activationMsa,
      openActivation,
      closeActivation,
    }),
    [
      selectedMsaId,
      hoveredMsaId,
      recentMsaIds,
      recordRecentMsa,
      focusSearch,
      activationMsa,
      openActivation,
      closeActivation,
    ],
  );

  return (
    <MsaNavigationContext.Provider value={value}>{children}</MsaNavigationContext.Provider>
  );
}

export function useMsaNavigation() {
  const context = useContext(MsaNavigationContext);
  if (!context) {
    throw new Error("useMsaNavigation must be used within MsaNavigationProvider");
  }
  return context;
}

export function useOptionalMsaById(msaId: string | null): MSA | undefined {
  const { msas } = usePortfolio();
  return msaId ? getMsaById(msas, msaId) : undefined;
}
