import type { MsaBase } from "@/types/msa";

/** Activated markets have onboarding progress or an explicit activation timestamp. */
export function isMsaActivated(msa: MsaBase): boolean {
  return Boolean(
    msa.activatedAt ||
      msa.onboardingStatus === "complete" ||
      msa.onboardingStatus === "in_progress" ||
      msa.onboardingStatus === "pending",
  );
}

export function isMsaInactive(msa: MsaBase): boolean {
  return !isMsaActivated(msa);
}
