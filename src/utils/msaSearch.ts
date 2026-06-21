import type { MsaStatus } from "@/types/msa";
import { formatCurrency } from "@/utils/format";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseRevenueValue(token: string, unit?: string): number {
  const value = parseFloat(token);
  if (Number.isNaN(value)) return 0;

  const normalizedUnit = unit?.toLowerCase() ?? "";
  if (normalizedUnit === "m" || normalizedUnit.startsWith("mil")) {
    return value * 1_000_000;
  }
  if (normalizedUnit === "k" || normalizedUnit.startsWith("thou")) {
    return value * 1_000;
  }
  if (value < 1_000) {
    return value * 1_000_000;
  }
  return value;
}

function matchesRevenue(revenue: number, query: string): boolean {
  if (revenue <= 0) return false;

  const normalized = query.trim().toLowerCase().replace(/,/g, "");
  const compactFormatted = formatCurrency(revenue).toLowerCase().replace(/\s/g, "");

  if (compactFormatted.includes(normalized.replace(/\s/g, ""))) return true;

  const rangeMatch = normalized.match(
    /^([\d.]+)\s*(m|k|million|thousand)?\s*-\s*([\d.]+)\s*(m|k|million|thousand)?$/,
  );
  if (rangeMatch) {
    const min = parseRevenueValue(rangeMatch[1], rangeMatch[2]);
    const max = parseRevenueValue(rangeMatch[3], rangeMatch[4]);
    return revenue >= min && revenue <= max;
  }

  const greaterMatch = normalized.match(/^>\s*([\d.]+)\s*(m|k|million|thousand)?$/);
  if (greaterMatch) {
    return revenue > parseRevenueValue(greaterMatch[1], greaterMatch[2]);
  }

  const lessMatch = normalized.match(/^<\s*([\d.]+)\s*(m|k|million|thousand)?$/);
  if (lessMatch) {
    return revenue < parseRevenueValue(lessMatch[1], lessMatch[2]);
  }

  const valueMatch = normalized.match(/^([\d.]+)\s*(m|k|million|thousand)?$/);
  if (valueMatch) {
    const target = parseRevenueValue(valueMatch[1], valueMatch[2]);
    const tolerance = target * 0.2;
    return Math.abs(revenue - target) <= tolerance;
  }

  if (normalized.includes("$")) {
    const digits = normalized.replace(/[^0-9.]/g, "");
    if (digits && compactFormatted.includes(digits)) return true;
  }

  return false;
}

export function filterMsasByQuery<T extends {
  name: string;
  state: string;
  status: MsaStatus;
  revenue: number;
}>(
  msas: T[],
  query: string,
  getStatusLabel: (status: MsaStatus) => string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return msas;

  return msas.filter((msa) => {
    if (msa.name.toLowerCase().includes(normalized)) return true;
    if (msa.state.toLowerCase().includes(normalized)) return true;
    if (getStatusLabel(msa.status).toLowerCase().includes(normalized)) return true;
    if (msa.name.split("-")[0]?.trim().toLowerCase().includes(normalized)) return true;
    if (matchesRevenue(msa.revenue, query)) return true;
    return false;
  });
}

export function useMsaSearchQuery<
  T extends { name: string; state: string; status: MsaStatus; revenue: number },
>(msas: T[], query: string, getStatusLabel: (status: MsaStatus) => string) {
  const debouncedQuery = useDebouncedValue(query, 200);

  return {
    debouncedQuery,
    filteredMsas: filterMsasByQuery(msas, debouncedQuery, getStatusLabel),
    isSearching: debouncedQuery.trim().length > 0,
  };
}
