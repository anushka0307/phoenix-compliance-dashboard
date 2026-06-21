import type { MSA } from "@/types/msa";
import { getPgAcquisitionWorkspace } from "@/utils/pgAcquisitionStore";
import { isMsaActivated } from "@/utils/msaActivation";

export interface OperationalReadiness {
  ready: boolean;
  label: string;
  reasons: string[];
}

const ESTABLISHED_STATUSES: MSA["status"][] = ["growing", "attention-required", "opportunity"];

export function shouldShowInsufficientDataEmptyState(msa: MSA): boolean {
  if (!isMsaActivated(msa) || msa.status === "inactive") {
    return false;
  }

  const workspace = getPgAcquisitionWorkspace(msa);
  if (workspace.pgs.length > 0) {
    return false;
  }

  const activatedAt = msa.activatedAt ? new Date(msa.activatedAt).getTime() : 0;
  const hoursSinceActivation = activatedAt > 0 ? (Date.now() - activatedAt) / 3_600_000 : Number.POSITIVE_INFINITY;

  return hoursSinceActivation < 24;
}

export function getOperationalReadiness(msa: MSA): OperationalReadiness {
  if (!isMsaActivated(msa) || msa.status === "inactive") {
    return { ready: false, label: "Inactive", reasons: ["Market not activated"] };
  }

  if (ESTABLISHED_STATUSES.includes(msa.status)) {
    return { ready: true, label: "Operational", reasons: [] };
  }

  if (msa.status === "new-market") {
    if (shouldShowInsufficientDataEmptyState(msa)) {
      return {
        ready: false,
        label: "New Market",
        reasons: ["Onboarding in progress — metrics populate within 24 hours"],
      };
    }

    return {
      ready: true,
      label: "New Market",
      reasons: ["Early-stage operations with estimated metrics"],
    };
  }

  return { ready: true, label: "Operational", reasons: [] };
}

export function shouldShowAdvancedOperationalMetrics(msa: MSA): boolean {
  if (!isMsaActivated(msa) || msa.status === "inactive") {
    return false;
  }

  return !shouldShowInsufficientDataEmptyState(msa);
}

export const INSUFFICIENT_DATA_LABEL = "Onboarding in progress";
export const AVAILABLE_AFTER_ONBOARDING_LABEL = "Metrics populate within 24 hours";
