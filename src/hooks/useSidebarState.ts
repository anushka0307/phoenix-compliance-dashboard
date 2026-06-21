import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { MsaStatus } from "@/types/msa";
import {
  DEFAULT_GROUP_EXPANDED,
  GROUP_STORAGE_KEY,
} from "@/utils/sidebarRows";

const RECENT_STORAGE_KEY = "phoenix-recent-msas";
const MAX_RECENT = 3;

function readRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function readGroupState(): Record<MsaStatus, boolean> {
  try {
    const raw = localStorage.getItem(GROUP_STORAGE_KEY);
    if (!raw) return DEFAULT_GROUP_EXPANDED;
    return { ...DEFAULT_GROUP_EXPANDED, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GROUP_EXPANDED;
  }
}

export function useSidebarGroupState() {
  const [expandedGroups, setExpandedGroups] =
    useState<Record<MsaStatus, boolean>>(readGroupState);

  const toggleGroup = useCallback((status: MsaStatus) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [status]: !prev[status] };
      localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { expandedGroups, toggleGroup };
}

export function useRecentMsas() {
  const [recentMsaIds, setRecentMsaIds] = useState<string[]>(readRecentIds);
  const location = useLocation();

  const recordRecentMsa = useCallback((msaId: string) => {
    setRecentMsaIds((prev) => {
      const next = [msaId, ...prev.filter((id) => id !== msaId)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const match = location.pathname.match(/^\/msa\/([^/]+)/);
    if (match?.[1]) {
      recordRecentMsa(match[1]);
    }
  }, [location.pathname, recordRecentMsa]);

  return { recentMsaIds, recordRecentMsa };
}
