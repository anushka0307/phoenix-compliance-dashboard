import type { MsaStatus } from "@/types/msa";

export const msaStatusConfig: Record<
  MsaStatus,
  { label: string; variant: "growing" | "opportunity" | "attention" | "inactive" | "new-market" }
> = {
  growing: { label: "Growing", variant: "growing" },
  opportunity: { label: "Opportunity", variant: "opportunity" },
  "attention-required": { label: "Attention Required", variant: "attention" },
  "new-market": { label: "New Market", variant: "new-market" },
  inactive: { label: "Inactive", variant: "inactive" },
};

export const msaStatusMapColors: Record<MsaStatus, string> = {
  growing: "#22C55E",
  opportunity: "#F59E0B",
  "attention-required": "#EF4444",
  "new-market": "#3B82F6",
  inactive: "#B0BEC8",
};

export const msaStatusMapFill: Record<MsaStatus, string> = {
  growing: "#22C55E",
  opportunity: "#F59E0B",
  "attention-required": "#EF4444",
  "new-market": "#3B82F6",
  inactive: "#B0BEC8",
};

export function getMsaStatusLabel(status: MsaStatus): string {
  return msaStatusConfig[status].label;
}

export function getMsaStatusVariant(status: MsaStatus) {
  return msaStatusConfig[status].variant;
}

export function isOperationalMsaStatus(status: MsaStatus): boolean {
  return status !== "inactive";
}

export function isClassifiedMsaStatus(status: MsaStatus): boolean {
  return status === "growing" || status === "opportunity" || status === "attention-required";
}

export function getShortMarketName(name: string): string {
  return name.split("-")[0]?.trim() ?? name;
}
