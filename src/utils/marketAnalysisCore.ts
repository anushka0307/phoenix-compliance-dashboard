import type { MSA } from "@/types/msa";
import { isMsaActivated } from "@/utils/msaActivation";

export function computeOpportunityScore(
  marketSizeMillions: number,
  growthRatePercent: number,
  hhaDensityPer100k: number,
  competitiveIntensity: number,
): number {
  if (competitiveIntensity <= 0) return 0;
  const raw = (marketSizeMillions * growthRatePercent * hhaDensityPer100k) / competitiveIntensity;
  return Math.min(100, Math.round(raw * 10) / 10);
}

export function computeHhaDensity(
  activeHomeHealthAgencies: number,
  medicarePopulation: number,
): number {
  if (medicarePopulation <= 0) return 0;
  return Math.round((activeHomeHealthAgencies / medicarePopulation) * 100_000 * 10) / 10;
}

export function computeTam(
  totalAddressablePatients: number,
  annualValuePerPatient: number,
): number {
  return totalAddressablePatients * annualValuePerPatient;
}

export function computeMarketPenetration(
  daPatients: number,
  totalAddressablePatients: number,
): number {
  if (totalAddressablePatients <= 0) return 0;
  return Math.min(100, Math.round((daPatients / totalAddressablePatients) * 1000) / 10);
}

export function computePgPenetration(
  activePhysicianGroups: number,
  totalPhysicianGroups: number,
): number {
  if (totalPhysicianGroups <= 0) return 0;
  return Math.min(100, Math.round((activePhysicianGroups / totalPhysicianGroups) * 1000) / 10);
}

export function computeNetworkRank(msa: MSA, networkMsas: MSA[]): number {
  const activeMsas = networkMsas.filter((item) => isMsaActivated(item) && item.status !== "inactive");
  const ranked = [...activeMsas].sort((a, b) => {
    if (b.healthScore !== a.healthScore) return b.healthScore - a.healthScore;
    return b.revenue - a.revenue;
  });
  const index = ranked.findIndex((item) => item.id === msa.id);
  return index >= 0 ? index + 1 : ranked.length + 1;
}
