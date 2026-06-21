import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { usePortfolio } from "@/contexts/NetworkContext";
import type { MSA } from "@/types/msa";

export function useMsa(): { msa: MSA | undefined; msaId: string | undefined } {
  const { msaId } = useParams<{ msaId: string }>();
  const { getMsa } = usePortfolio();

  const msa = useMemo(() => {
    if (!msaId) return undefined;
    return getMsa(msaId);
  }, [msaId, getMsa]);

  return { msa, msaId };
}
