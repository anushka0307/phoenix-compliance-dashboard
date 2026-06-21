import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import type { DashboardPeriod, MSA, MsaBase } from "@/types/msa";
import type { MarketActivationPayload } from "@/types/pgAcquisition";
import { loadMetropolitanCbsaCatalog } from "@/data/cbsaCatalog";
import { buildActivationUpdate, getMsaById } from "@/data/mockMsas";
import { buildMarketActivationContext } from "@/utils/marketActivationContext";
import { initializePgAcquisitionFromActivation } from "@/utils/pgAcquisitionStore";
import {
  loadPersistedActiveMsas,
  savePersistedActiveMsas,
} from "@/utils/demoPersistence";
import { seedCampaignsForMsa } from "@/utils/acquisitionCampaignStore";
import { getPgAcquisitionWorkspace } from "@/utils/pgAcquisitionStore";
import { getMetricsByDateRange } from "@/utils/dashboardMetrics";
import {
  getComparisonDateRange,
  resolvePresetDateRange,
  validateCustomDateRange,
  type ResolvedDateRange,
} from "@/utils/dateRangeHelpers";
import { getNetworkKpis } from "@/utils/networkAnalytics";
import {
  buildAllMsas,
  getActiveMsas,
  mergeCatalogWithActiveMsas,
} from "@/utils/msaUniverse";
import {
  geographyRecordToMsa,
  geographyRecordToMsaBase,
  loadGeographyCatalog,
} from "@/utils/geographyCoverage";
import type { GeographyRecord } from "@/types/geography";

export interface ActivationToastState {
  msaName: string;
  totalMsas: number;
  estimatedRevenue: number;
}

export type SidebarMarketFilter =
  | "all"
  | "inactive"
  | "ready"
  | "evaluation"
  | "blocked"
  | MSA["status"];

interface NetworkContextValue {
  allMsas: MSA[];
  activeMsas: MSA[];
  msas: MSA[];
  dashboardMsas: MSA[];
  dashboardAllMsas: MSA[];
  dashboardPreviousMsas: MSA[] | null;
  msaBase: MsaBase[];
  activeMsaBase: MsaBase[];
  catalogLoaded: boolean;
  period: DashboardPeriod;
  dateRange: ResolvedDateRange;
  lastUpdated: Date;
  setPeriod: (period: DashboardPeriod) => void;
  setPreset: (period: DashboardPeriod) => void;
  applyCustomRange: (start: string, end: string) => boolean;
  resetCustomRange: () => void;
  clearCustomRange: () => void;
  sidebarFilter: SidebarMarketFilter;
  setSidebarFilter: (filter: SidebarMarketFilter) => void;
  pulsingMsaId: string | null;
  activationToast: ActivationToastState | null;
  onboardingMsaId: string | null;
  dismissOnboarding: () => void;
  activateMarket: (msaId: string, payload: MarketActivationPayload) => void;
  getMsa: (id: string) => MSA | undefined;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

const VALID_PERIODS: DashboardPeriod[] = ["overall", "30d", "quarter", "year", "custom"];

function parsePeriod(value: string | null): DashboardPeriod {
  if (value && VALID_PERIODS.includes(value as DashboardPeriod)) {
    return value as DashboardPeriod;
  }
  return "overall";
}

function syncDateParams(
  params: URLSearchParams,
  period: DashboardPeriod,
  start: string,
  end: string,
) {
  params.set("period", period);
  params.set("start", start);
  params.set("end", end);
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<MsaBase[]>([]);
  const [geographyCatalog, setGeographyCatalog] = useState<GeographyRecord[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [activeMsaBase, setActiveMsaBase] = useState<MsaBase[]>(() => loadPersistedActiveMsas());
  const [pulsingMsaId, setPulsingMsaId] = useState<string | null>(null);
  const [activationToast, setActivationToast] = useState<ActivationToastState | null>(null);
  const [onboardingMsaId, setOnboardingMsaId] = useState<string | null>(null);
  const [sidebarFilter, setSidebarFilter] = useState<SidebarMarketFilter>("all");
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const period = parsePeriod(searchParams.get("period"));
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const dateRange = useMemo(
    () => resolvePresetDateRange(period, startParam, endParam),
    [period, startParam, endParam],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadMetropolitanCbsaCatalog(), loadGeographyCatalog()])
      .then(([entries, geographies]) => {
        if (!cancelled) {
          setCatalog(entries);
          setGeographyCatalog(geographies);
          setCatalogLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (startParam && endParam) return;

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        syncDateParams(params, dateRange.preset, dateRange.start, dateRange.end);
        return params;
      },
      { replace: true },
    );
  }, [startParam, endParam, dateRange, setSearchParams]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [dateRange.start, dateRange.end, dateRange.preset]);

  useEffect(() => {
    savePersistedActiveMsas(activeMsaBase);
  }, [activeMsaBase]);

  const allMsaBase = useMemo(
    () => (catalog.length > 0 ? mergeCatalogWithActiveMsas(catalog, activeMsaBase) : []),
    [catalog, activeMsaBase],
  );

  const allMsas = useMemo(() => {
    if (catalog.length === 0) {
      return buildAllMsas(activeMsaBase, activeMsaBase);
    }
    return buildAllMsas(catalog, activeMsaBase);
  }, [catalog, activeMsaBase]);

  const activeMsas = useMemo(() => getActiveMsas(allMsas), [allMsas]);

  useEffect(() => {
    if (!catalogLoaded) return;
    for (const msa of activeMsas) {
      const workspace = getPgAcquisitionWorkspace(msa);
      seedCampaignsForMsa(msa, workspace.pgs);
    }
  }, [catalogLoaded, activeMsas]);

  const dashboardMsas = useMemo(
    () => getMetricsByDateRange(activeMsas, dateRange),
    [activeMsas, dateRange],
  );

  const comparisonRange = useMemo(() => getComparisonDateRange(dateRange), [dateRange]);

  const dashboardPreviousMsas = useMemo(() => {
    if (!comparisonRange) return null;
    return getMetricsByDateRange(activeMsas, comparisonRange);
  }, [activeMsas, comparisonRange]);

  const dashboardAllMsas = useMemo(() => {
    const activeByCbsa = new Map(dashboardMsas.map((msa) => [msa.cbsaCode, msa]));
    return allMsas.map((msa) => activeByCbsa.get(msa.cbsaCode) ?? msa);
  }, [allMsas, dashboardMsas]);

  const setPreset = useCallback(
    (next: DashboardPeriod) => {
      const range = resolvePresetDateRange(
        next,
        next === "custom" ? startParam : null,
        next === "custom" ? endParam : null,
      );

      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          syncDateParams(params, next, range.start, range.end);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams, startParam, endParam],
  );

  const setPeriod = setPreset;

  const applyCustomRange = useCallback(
    (start: string, end: string) => {
      const validation = validateCustomDateRange(start, end);
      if (!validation.valid) return false;

      const range = resolvePresetDateRange("custom", start, end);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          syncDateParams(params, "custom", range.start, range.end);
          return params;
        },
        { replace: true },
      );
      return true;
    },
    [setSearchParams],
  );

  const clearCustomRange = useCallback(() => {
    setPreset("overall");
  }, [setPreset]);

  const resetCustomRange = clearCustomRange;

  const activateMarket = useCallback(
    (msaId: string, payload: MarketActivationPayload) => {
      setActiveMsaBase((prev) => {
        const existing =
          getMsaById(prev, msaId) ??
          getMsaById(allMsaBase, msaId) ??
          getMsaById(catalog, msaId) ??
            geographyRecordToMsaBase(
              geographyCatalog.find((geo) => geo.id === msaId) ?? {
                id: msaId,
                kind: "msa" as const,
                code: msaId,
                name: payload.physicianGroup.pgName,
                state: "",
                population: 0,
                status: "inactive" as const,
              },
            );
        if (!existing) return prev;

        const updated = buildActivationUpdate(msaId, payload, existing);
        const next = [...prev.filter((msa) => msa.cbsaCode !== updated.cbsaCode), updated];
        const activated = buildAllMsas(
          catalog.length > 0 ? catalog : [updated],
          next,
        ).find((m) => m.id === msaId || m.cbsaCode === updated.cbsaCode);

        if (activated) {
          const context = buildMarketActivationContext(activated, next.length > 0 ? buildAllMsas(catalog, next) : [activated]);
          initializePgAcquisitionFromActivation(msaId, payload, context.opportunityScore);
          setActivationToast({
            msaName: activated.name,
            totalMsas: next.length,
            estimatedRevenue: updated.revenue,
          });
        }

        return next;
      });

      setPulsingMsaId(msaId);
      setOnboardingMsaId(msaId);
      setSidebarFilter("all");

      window.setTimeout(() => setPulsingMsaId(null), 4000);
      window.setTimeout(() => setActivationToast(null), 4500);
    },
    [allMsaBase, catalog, geographyCatalog],
  );

  const geographyMarkets = useMemo(() => {
    if (geographyCatalog.length === 0) return [] as MSA[];
    const byCbsa = new Map(allMsas.map((msa) => [msa.cbsaCode, msa]));
    return geographyCatalog.map((geo) => {
      if (geo.kind === "msa" && geo.cbsaCode) {
        return byCbsa.get(geo.cbsaCode) ?? geographyRecordToMsa(geo);
      }
      return geographyRecordToMsa(geo);
    });
  }, [geographyCatalog, allMsas]);

  const dismissOnboarding = useCallback(() => {
    setOnboardingMsaId(null);
  }, []);

  const getMsa = useCallback(
    (id: string) => getMsaById(allMsas, id) ?? getMsaById(geographyMarkets, id),
    [allMsas, geographyMarkets],
  );

  const value = useMemo(
    () => ({
      allMsas,
      activeMsas,
      msas: allMsas,
      dashboardMsas,
      dashboardAllMsas,
      dashboardPreviousMsas,
      msaBase: allMsaBase,
      activeMsaBase,
      catalogLoaded,
      period,
      dateRange,
      lastUpdated,
      setPeriod,
      setPreset,
      applyCustomRange,
      resetCustomRange,
      clearCustomRange,
      sidebarFilter,
      setSidebarFilter,
      pulsingMsaId,
      activationToast,
      onboardingMsaId,
      dismissOnboarding,
      activateMarket,
      getMsa,
    }),
    [
      allMsas,
      activeMsas,
      dashboardMsas,
      dashboardAllMsas,
      dashboardPreviousMsas,
      allMsaBase,
      activeMsaBase,
      catalogLoaded,
      period,
      dateRange,
      lastUpdated,
      setPeriod,
      setPreset,
      applyCustomRange,
      resetCustomRange,
      clearCustomRange,
      sidebarFilter,
      pulsingMsaId,
      activationToast,
      onboardingMsaId,
      dismissOnboarding,
      activateMarket,
      getMsa,
    ],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

/** @deprecated Use NetworkProvider */
export const PortfolioProvider = NetworkProvider;

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within NetworkProvider");
  }
  return context;
}

/** @deprecated Use useNetwork */
export const usePortfolio = useNetwork;

export function useNetworkKpis() {
  const { dashboardMsas } = useNetwork();
  return useMemo(() => getNetworkKpis(dashboardMsas), [dashboardMsas]);
}

/** @deprecated Use useNetworkKpis */
export const usePortfolioKpis = useNetworkKpis;
