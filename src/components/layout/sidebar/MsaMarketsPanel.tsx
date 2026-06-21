import { useCallback, useEffect, useMemo, useState } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";
import { useSidebarGroupState } from "@/hooks/useSidebarState";
import { MsaSidebarSearch } from "@/components/layout/sidebar/MsaSidebarSearch";
import { MsaSidebarList } from "@/components/layout/sidebar/MsaSidebarList";
import { getMsaStatusLabel } from "@/utils/msaStatus";
import { useMsaSearchQuery } from "@/utils/msaSearch";
import { buildSidebarRows } from "@/utils/sidebarRows";

interface MsaMarketsPanelProps {
  onNavigate?: () => void;
}

export function MsaMarketsPanel({ onNavigate }: MsaMarketsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { dashboardAllMsas, catalogLoaded } = useNetwork();
  const { selectedMsaId, hoveredMsaId, setHoveredMsaId, focusSearch } = useMsaNavigation();
  const { expandedGroups, toggleGroup } = useSidebarGroupState();

  const { debouncedQuery, filteredMsas, isSearching } = useMsaSearchQuery(
    dashboardAllMsas,
    searchQuery,
    getMsaStatusLabel,
  );

  const rows = useMemo(
    () => buildSidebarRows(dashboardAllMsas, isSearching, filteredMsas, expandedGroups),
    [dashboardAllMsas, isSearching, filteredMsas, expandedGroups],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusSearch]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [debouncedQuery, expandedGroups]);

  const matchLabel = isSearching
    ? `Showing ${filteredMsas.length} of ${dashboardAllMsas.length} markets`
    : `${dashboardAllMsas.length} markets`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-1 px-1 pb-1">
        <MsaSidebarSearch value={searchQuery} onChange={setSearchQuery} onClear={clearSearch} />
        <div className="px-0.5 text-xs text-muted-foreground">
          <span>
            {!catalogLoaded
              ? "Loading U.S. metro areas…"
              : matchLabel}
          </span>
        </div>
      </div>

      <p className="mb-0.5 shrink-0 px-1 text-sm font-semibold leading-tight uppercase tracking-[0.06em] text-muted-foreground">
        Markets (MSA)
      </p>

      <div className="sidebar-market-list flex min-h-0 flex-1 flex-col overflow-hidden">
        <MsaSidebarList
          rows={rows}
          query={debouncedQuery}
          selectedMsaId={selectedMsaId}
          hoveredMsaId={hoveredMsaId}
          focusedIndex={focusedIndex}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          onNavigate={onNavigate}
          onHover={setHoveredMsaId}
          onFocusedIndexChange={setFocusedIndex}
          emptyMessage="No markets found."
        />
      </div>
    </div>
  );
}
