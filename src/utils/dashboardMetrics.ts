import type { MSA } from "@/types/msa";
import type { ResolvedDateRange } from "@/utils/dateRangeHelpers";
import { getDateRangeScale } from "@/utils/dateRangeHelpers";

function scaleCount(value: number, scale: number): number {
  if (value <= 0) return 0;
  return Math.max(1, Math.round(value * scale));
}

function scaleHealthScore(score: number, scale: number): number {
  if (score <= 0) return 0;
  const modifier = scale >= 1 ? 1 + Math.min(0.1, (scale - 1) * 0.06) : 0.88 + scale * 0.12;
  return Math.min(100, Math.round(score * modifier));
}

export function applyDateRangeToMsa(msa: MSA, range: ResolvedDateRange): MSA {
  if (msa.status === "inactive") return msa;

  const scale = getDateRangeScale(range);
  if (range.preset === "overall") {
    return { ...msa };
  }

  return {
    ...msa,
    revenue: Math.round(msa.revenue * scale),
    patients: Math.round(msa.patients * scale),
    physicianGroups: scaleCount(msa.physicianGroups, scale),
    homeHealthAgencies: scaleCount(msa.homeHealthAgencies, scale),
    physicians: scaleCount(msa.physicians, scale),
    healthScore: scaleHealthScore(msa.healthScore, scale),
    conversionRate:
      Math.round(msa.conversionRate * (0.9 + Math.min(scale, 1) * 0.1) * 10) / 10,
    churnRate: Math.max(0, Math.round(msa.churnRate * (1.08 - scale * 0.08) * 10) / 10),
  };
}

export function applyDateRangeToMsas(msas: MSA[], range: ResolvedDateRange): MSA[] {
  return msas.map((msa) => applyDateRangeToMsa(msa, range));
}

/** Applies the selected dashboard date range to network MSA metrics. */
export function getMetricsByDateRange(
  msas: MSA[],
  range: ResolvedDateRange,
): MSA[] {
  return applyDateRangeToMsas(msas, range);
}
