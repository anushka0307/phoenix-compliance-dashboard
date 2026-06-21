import type { MSA } from "@/types/msa";
import type { MarketActivationContext } from "@/types/marketActivation";
import { getMarketAnalysisBundle } from "@/data/marketAnalysisData";
import { buildCoverage, buildExecutiveKpis } from "@/utils/marketAnalysisHelpers";
import { buildMarketSizing } from "@/utils/marketCalculations";
import { computeTam } from "@/utils/marketAnalysisCore";
import { getOpportunityMetrics } from "@/utils/geographyCoverage";

export function buildMarketActivationContext(msa: MSA, networkMsas: MSA[]): MarketActivationContext {
  const bundle = getMarketAnalysisBundle(msa.id);
  const population = bundle.profile.totalPopulation || msa.population;
  const sizing = buildMarketSizing(
    population,
    bundle.profile.medicarePopulation,
    bundle.profile.chronicDiseasePrevalence,
  );
  const coverage = msa.status === "inactive" ? null : buildCoverage(msa);
  const kpis =
    msa.status === "inactive"
      ? null
      : buildExecutiveKpis(msa, networkMsas);
  const opportunity = getOpportunityMetrics(population);
  const tam =
    sizing.addressableAssumptions
      ? computeTam(sizing.addressablePatients, bundle.profile.annualValuePerPatient)
      : opportunity.estimatedTam;

  return {
    msaId: msa.id,
    msaName: msa.name,
    state: msa.state,
    population,
    opportunityScore: kpis?.marketOpportunityScore ?? Math.round(bundle.profile.populationGrowthRate * 12),
    addressablePatients: sizing.addressablePatients,
    tam,
    zipCoverage: coverage?.zipCoverage ?? 0,
    referralCoverage: coverage?.referralCoverage ?? 0,
    competitiveIntensity: bundle.profile.competitiveIntensityScore,
  };
}
