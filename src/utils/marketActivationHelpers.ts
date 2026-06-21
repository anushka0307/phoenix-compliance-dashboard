import type { ClientActivationData, MsaBase } from "@/types/msa";
import type { MarketActivationPayload } from "@/types/pgAcquisition";

export function buildClientActivationData(
  existing: MsaBase,
  payload: MarketActivationPayload,
): ClientActivationData {
  const pg = payload.physicianGroup;
  const monthlyRevenue = pg.estimatedMonthlyReferralVolume * 390;

  return {
    clientName: pg.pgName,
    msaName: existing.name,
    state: existing.state,
    population: existing.population,
    contractStartDate: new Date().toISOString().slice(0, 10),
    estimatedAnnualRevenue: Math.round(monthlyRevenue * 12),
    primaryContact: pg.primaryContactName,
    initialAgencies: payload.hhaRelationships.length,
    notes: pg.notes,
    physicianGroup: pg,
    hhaRelationships: payload.hhaRelationships,
  };
}
