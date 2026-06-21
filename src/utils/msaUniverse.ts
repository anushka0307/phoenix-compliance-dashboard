import type { MSA, MsaBase } from "@/types/msa";
import { enrichMsas } from "@/utils/calculateMsaMetrics";
import { isMsaActivated } from "@/utils/msaActivation";

const INACTIVE_DEFAULTS: Pick<
  MsaBase,
  | "status"
  | "revenue"
  | "onboardingDays"
  | "conversionRate"
  | "churnRate"
  | "healthScore"
> = {
  status: "inactive",
  revenue: 0,
  onboardingDays: 0,
  conversionRate: 0,
  churnRate: 0,
  healthScore: 0,
};

/** Phoenix-activated markets only (seed data). */
export function getInitialActiveMsas(seed: MsaBase[]): MsaBase[] {
  return seed.filter(isMsaActivated);
}

export function mergeCatalogWithActiveMsas(
  catalog: MsaBase[],
  activeMsas: MsaBase[],
): MsaBase[] {
  const activeByCbsa = new Map(activeMsas.map((msa) => [msa.cbsaCode, msa]));
  const mergedCatalog = catalog.map((entry) => {
    const active = activeByCbsa.get(entry.cbsaCode);
    if (active) {
      return {
        ...entry,
        ...active,
        cbsaCode: entry.cbsaCode,
        name: active.name || entry.name,
        state: active.state || entry.state,
        population: active.population || entry.population,
      };
    }
    return { ...entry, ...INACTIVE_DEFAULTS };
  });

  const catalogCodes = new Set(catalog.map((entry) => entry.cbsaCode));
  const extras = activeMsas.filter((msa) => !catalogCodes.has(msa.cbsaCode));

  return [...mergedCatalog, ...extras];
}

export function buildAllMsas(catalog: MsaBase[], activeMsas: MsaBase[]): MSA[] {
  return enrichMsas(mergeCatalogWithActiveMsas(catalog, activeMsas));
}

export function getActiveMsas(allMsas: MSA[]): MSA[] {
  return allMsas.filter((msa) => msa.status !== "inactive");
}
