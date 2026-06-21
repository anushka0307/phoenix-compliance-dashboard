import { useMemo } from "react";
import type { MSA } from "@/types/msa";
import { usePortfolio } from "@/contexts/NetworkContext";

export function useMsaCbsaIndex() {
  const { dashboardAllMsas } = usePortfolio();

  return useMemo(() => {
    const byCbsa = new Map<string, MSA>();
    const portfolioCbsaCodes = new Set<string>();

    for (const msa of dashboardAllMsas) {
      byCbsa.set(msa.cbsaCode, msa);
      portfolioCbsaCodes.add(msa.cbsaCode);
    }

    return { byCbsa, portfolioCbsaCodes, msas: dashboardAllMsas };
  }, [dashboardAllMsas]);
}
