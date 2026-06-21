import type { MSA } from "@/types/msa";
import type { AddressablePatientAssumptions } from "@/types/marketAnalysis";

export interface MarketSizing {
  population: number;
  addressablePatients: number;
  totalPhysicianGroups: number;
  totalPhysicians: number;
  totalHomeHealthAgencies: number;
  addressableAssumptions?: AddressablePatientAssumptions;
}

export interface MarketCoverageMetrics {
  pgPenetration: number;
  patientReach: number;
  zipCoverage: number;
  referralCoverage: number;
  hhaCoverage: number;
  revenuePerPatient: number;
  activePatients: number;
  activePhysicianGroups: number;
  partnerHhas: number;
  totalZipCodes: number;
  coveredZipCodes: number;
}

export interface DataQualityWarning {
  id: string;
  message: string;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(100, Math.round(value * 10) / 10);
}

export const SLA_TARGET_DAYS = 30;
export const MEDICARE_ELIGIBILITY_RATE = 0.94;
export const SERVICE_FIT_SCORE = 0.38;

export function computeAddressablePatientsFromMedicare(
  medicarePopulation: number,
  chronicDiseasePrevalencePercent: number,
): { addressablePatients: number; assumptions: AddressablePatientAssumptions } {
  const chronicCarePrevalence = chronicDiseasePrevalencePercent / 100;
  const addressablePatients = Math.round(
    medicarePopulation * MEDICARE_ELIGIBILITY_RATE * chronicCarePrevalence * SERVICE_FIT_SCORE,
  );
  return {
    addressablePatients,
    assumptions: {
      medicarePopulation,
      eligibilityRate: MEDICARE_ELIGIBILITY_RATE,
      chronicCarePrevalence: chronicDiseasePrevalencePercent,
      serviceFitScore: SERVICE_FIT_SCORE,
    },
  };
}

export function computeAddressablePatients(population: number): number {
  if (population <= 0) return 0;
  return Math.round(population * 0.01);
}

export function computeTotalPhysicianGroups(addressablePatients: number): number {
  if (addressablePatients <= 0) return 0;
  return Math.round(addressablePatients * 0.1);
}

export function computeTotalPhysicians(totalPhysicianGroups: number): number {
  return totalPhysicianGroups * 50;
}

export function computeTotalHomeHealthAgencies(population: number): number {
  if (population <= 0) return 0;
  return Math.round(population * 0.01);
}

export function buildMarketSizing(
  population: number,
  medicarePopulation?: number,
  chronicDiseasePrevalence?: number,
): MarketSizing {
  let addressablePatients: number;
  let addressableAssumptions: AddressablePatientAssumptions | undefined;

  if (medicarePopulation && medicarePopulation > 0 && chronicDiseasePrevalence !== undefined) {
    const result = computeAddressablePatientsFromMedicare(
      medicarePopulation,
      chronicDiseasePrevalence,
    );
    addressablePatients = result.addressablePatients;
    addressableAssumptions = result.assumptions;
  } else {
    addressablePatients = computeAddressablePatients(population);
  }

  const totalPhysicianGroups = computeTotalPhysicianGroups(addressablePatients);
  return {
    population,
    addressablePatients,
    totalPhysicianGroups,
    totalPhysicians: computeTotalPhysicians(totalPhysicianGroups),
    totalHomeHealthAgencies: computeTotalHomeHealthAgencies(population),
    addressableAssumptions,
  };
}

export function computePatientReach(
  activePatients: number,
  addressablePatients: number,
): number {
  if (addressablePatients <= 0) return 0;
  return clampPercent((activePatients / addressablePatients) * 100);
}

export function computeCappedPatientReach(
  activePatients: number,
  addressablePatients: number,
  pgPenetration: number,
): number {
  return Math.min(
    computePatientReach(activePatients, addressablePatients),
    pgPenetration,
  );
}

export function computeOpportunityRevenue(
  estimatedAnnualReferrals: number,
  conversionRate: number,
  revenuePerPatient: number,
  retentionFactor: number,
): number {
  const conversion = conversionRate > 1 ? conversionRate / 100 : conversionRate;
  const retention = retentionFactor > 1 ? retentionFactor / 100 : retentionFactor;
  return Math.round(
    estimatedAnnualReferrals * conversion * revenuePerPatient * Math.max(0, Math.min(1, retention)),
  );
}

export interface SlaMetrics {
  averageOnboardingDays: number;
  slaTargetDays: number;
  slaCompliancePercent: number;
  pgsBreachingSla: number;
  totalTrackedPgs: number;
  breachPercent: number;
}

export function buildSlaMetrics(
  msa: MSA,
  totalAddressablePgs: number,
  seed: number,
): SlaMetrics {
  const slaTargetDays = SLA_TARGET_DAYS;
  const totalTrackedPgs = Math.max(
    totalAddressablePgs,
    msa.physicianGroups,
    Math.round(totalAddressablePgs * 0.9),
  );

  const averageOnboardingDays =
    msa.onboardingDays > 0 ? msa.onboardingDays : 18 + (seed % 14);

  const breachPercent = clampPercent(8 + (seed % 8));
  const pgsBreachingSla = Math.max(1, Math.round((totalTrackedPgs * breachPercent) / 100));
  const slaCompliancePercent = clampPercent(100 - breachPercent);

  return {
    averageOnboardingDays,
    slaTargetDays,
    slaCompliancePercent,
    pgsBreachingSla,
    totalTrackedPgs,
    breachPercent,
  };
}

export function computeZipCoverage(coveredZips: number, totalZips: number): number {
  if (totalZips <= 0) return 0;
  return clampPercent((coveredZips / totalZips) * 100);
}

export function computeReferralCoverage(
  activeReferralPathways: number,
  totalReferralPathways: number,
): number {
  if (totalReferralPathways <= 0) return 0;
  return clampPercent((activeReferralPathways / totalReferralPathways) * 100);
}

/** @deprecated Use computePatientReach */
export function computeMarketPenetration(
  activePatients: number,
  addressablePatients: number,
): number {
  if (addressablePatients <= 0) return 0;
  return clampPercent((activePatients / addressablePatients) * 100);
}

export function computePgPenetration(activePgs: number, totalPgs: number): number {
  if (totalPgs <= 0) return 0;
  return clampPercent((activePgs / totalPgs) * 100);
}

export function computeHhaCoverage(partnerHhas: number, totalHhas: number): number {
  if (totalHhas <= 0) return 0;
  return clampPercent((partnerHhas / totalHhas) * 100);
}

export function computeRevenuePerPatient(revenue: number, activePatients: number): number {
  if (activePatients <= 0) return 0;
  return Math.round(revenue / activePatients);
}

export function buildMarketCoverageMetrics(
  msa: MSA,
  sizing: MarketSizing,
  totalZipCodes: number,
  uncoveredZipCodes: number,
  referralPathways: { active: number; total: number },
): MarketCoverageMetrics {
  const pgPenetration = computePgPenetration(msa.physicianGroups, sizing.totalPhysicianGroups);
  const coveredZipCodes = Math.max(0, totalZipCodes - uncoveredZipCodes);

  return {
    activePatients: msa.patients,
    activePhysicianGroups: msa.physicianGroups,
    partnerHhas: msa.homeHealthAgencies,
    pgPenetration,
    patientReach: computeCappedPatientReach(
      msa.patients,
      sizing.addressablePatients,
      pgPenetration,
    ),
    zipCoverage: computeZipCoverage(coveredZipCodes, totalZipCodes),
    referralCoverage: computeReferralCoverage(referralPathways.active, referralPathways.total),
    hhaCoverage: computeHhaCoverage(msa.homeHealthAgencies, sizing.totalHomeHealthAgencies),
    revenuePerPatient: computeRevenuePerPatient(msa.revenue, msa.patients),
    totalZipCodes,
    coveredZipCodes,
  };
}

export function validateMarketData(
  msa: MSA,
  sizing: MarketSizing,
  hasDemographicSource: boolean,
): DataQualityWarning[] {
  const warnings: DataQualityWarning[] = [];

  if (sizing.population <= 0) {
    warnings.push({
      id: "missing-population",
      message: "Population data unavailable — market sizing estimates are suppressed.",
    });
  }

  if (!hasDemographicSource) {
    warnings.push({
      id: "demographic-fallback",
      message: "Using CBSA population estimates; full demographic profile not available for this market.",
    });
  }

  if (msa.patients > sizing.addressablePatients && sizing.addressablePatients > 0) {
    warnings.push({
      id: "patient-overflow",
      message: "Active patients exceed addressable patient estimate — patient reach capped at PG penetration.",
    });
  }

  if (msa.physicianGroups > sizing.totalPhysicianGroups && sizing.totalPhysicianGroups > 0) {
    warnings.push({
      id: "pg-overflow",
      message: "Active physician groups exceed market total — PG coverage capped at 100%.",
    });
  }

  if (msa.homeHealthAgencies > sizing.totalHomeHealthAgencies && sizing.totalHomeHealthAgencies > 0) {
    warnings.push({
      id: "hha-overflow",
      message: "Partner HHAs exceed market total — HHA coverage capped at 100%.",
    });
  }

  return warnings;
}

export function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
