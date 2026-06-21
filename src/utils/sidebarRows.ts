import type { MsaStatus } from "@/types/msa";

export const MSA_STATUS_ORDER: MsaStatus[] = [
  "growing",
  "opportunity",
  "attention-required",
  "new-market",
  "inactive",
];

export const GROUP_STORAGE_KEY = "phoenix-sidebar-groups";

export const DEFAULT_GROUP_EXPANDED: Record<MsaStatus, boolean> = {
  growing: true,
  opportunity: true,
  "attention-required": true,
  "new-market": true,
  inactive: false,
};

export type SidebarRow =
  | { kind: "group"; status: MsaStatus; count: number }
  | { kind: "msa"; msa: import("@/types/msa").MSA };

export function buildSidebarRows(
  allMsas: import("@/types/msa").MSA[],
  isSearching: boolean,
  filteredMsas: import("@/types/msa").MSA[],
  expandedGroups: Record<MsaStatus, boolean>,
): SidebarRow[] {
  if (isSearching) {
    return filteredMsas.map((msa) => ({ kind: "msa", msa }));
  }

  const rows: SidebarRow[] = [];

  for (const status of MSA_STATUS_ORDER) {
    const groupMsas = allMsas.filter((msa) => msa.status === status);
    if (groupMsas.length === 0) continue;

    rows.push({ kind: "group", status, count: groupMsas.length });

    if (expandedGroups[status]) {
      for (const msa of groupMsas) {
        rows.push({ kind: "msa", msa });
      }
    }
  }

  return rows;
}

export function getRowHeight(row: SidebarRow): number {
  return row.kind === "group" ? 24 : 40;
}
