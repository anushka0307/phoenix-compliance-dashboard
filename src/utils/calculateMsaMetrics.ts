import type { MSA, MsaBase, MsaDerivedMetrics } from "@/types/msa";
import { isMsaActivated } from "@/utils/msaActivation";
import { classifyMsaNetworkStatuses } from "@/utils/msaMarketClassification";

export function calculateMsaMetrics(population: number): MsaDerivedMetrics {
  const patients = Math.round(population * 0.01);
  const physicianGroups = Math.round(patients * 0.1);
  const physicians = physicianGroups * 50;
  const homeHealthAgencies = Math.round(population * 0.01);

  return {
    patients,
    physicianGroups,
    physicians,
    homeHealthAgencies,
  };
}

export function enrichMsa(msa: MsaBase): MSA {
  const derived = calculateMsaMetrics(msa.population);

  if (!isMsaActivated(msa)) {
    return {
      ...msa,
      status: "inactive",
      patients: 0,
      physicianGroups: 0,
      physicians: 0,
      homeHealthAgencies: 0,
    };
  }

  const physicianGroups = msa.operationalMetrics?.physicianGroups ?? derived.physicianGroups;
  const patients = Math.min(
    msa.operationalMetrics?.patients ?? derived.patients,
    Math.round(msa.population * 0.015),
  );
  const physicians = msa.operationalMetrics?.physicians ?? physicianGroups * 50;
  const homeHealthAgencies =
    msa.operationalMetrics?.homeHealthAgencies ??
    msa.clientData?.initialAgencies ??
    derived.homeHealthAgencies;

  return {
    ...msa,
    patients,
    physicianGroups,
    physicians,
    homeHealthAgencies,
  };
}

export function enrichMsas(msas: MsaBase[]): MSA[] {
  const enriched = msas.map(enrichMsa);
  return classifyMsaNetworkStatuses(enriched);
}
