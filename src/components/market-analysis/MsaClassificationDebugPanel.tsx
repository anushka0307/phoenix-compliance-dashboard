import { useMemo } from "react";
import { useMsa } from "@/hooks/useMsa";
import { usePortfolio } from "@/contexts/NetworkContext";
import {
  CLASSIFICATION_WEIGHTS,
  computeMsaComponentScores,
  computeMarketHealthScore,
  gatherMsaMarketSignals,
  getMsaClassification,
} from "@/utils/msaMarketClassification";

function isDebugClassificationEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("debug") === "classification" ||
    window.localStorage.getItem("phoenix:debug-classification") === "true"
  );
}

export function MsaClassificationDebugPanel() {
  const { msa } = useMsa();
  const { dashboardMsas } = usePortfolio();

  const debug = useMemo(() => {
    if (!msa || !isDebugClassificationEnabled()) return null;

    const stored = getMsaClassification(msa.id);
    const signals = gatherMsaMarketSignals(msa, dashboardMsas);
    const componentScores = computeMsaComponentScores(signals);
    const marketHealthScore = computeMarketHealthScore(componentScores);

    return {
      stored,
      signals,
      componentScores,
      marketHealthScore,
      weights: CLASSIFICATION_WEIGHTS,
      metadata: msa.classificationMetadata,
    };
  }, [msa, dashboardMsas]);

  if (!debug) return null;

  return (
    <aside
      aria-hidden="true"
      className="fixed bottom-4 right-4 z-[100] max-h-[70vh] w-[min(420px,calc(100vw-2rem))] overflow-auto rounded-lg border border-violet-300 bg-violet-950/95 p-3 font-mono text-[10px] text-violet-50 shadow-2xl"
    >
      <p className="mb-2 text-[11px] font-semibold text-violet-200">
        Classification Debug (dev only)
      </p>
      <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify(
          {
            msa: msa?.name,
            assignedStatus: msa?.status,
            marketHealthScore: debug.metadata?.marketHealthScore ?? debug.marketHealthScore,
            weights: debug.weights,
            rawSignals: debug.metadata?.rawSignals ?? debug.signals,
            normalizedScores: debug.metadata?.componentScores ?? debug.componentScores,
            classificationReasons: debug.metadata?.classificationReasons ?? debug.stored?.reasons,
            validationWarnings:
              debug.metadata?.validationWarnings ?? debug.stored?.validationWarnings,
            insufficientDataReasons: debug.metadata?.insufficientDataReasons,
          },
          null,
          2,
        )}
      </pre>
    </aside>
  );
}
