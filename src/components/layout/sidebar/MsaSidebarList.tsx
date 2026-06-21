import { useNavigate } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { List, useListRef, type RowComponentProps } from "react-window";
import { MsaSidebarRow, type MsaListRowProps } from "@/components/layout/sidebar/MsaSidebarRow";
import { getRowHeight } from "@/utils/sidebarRows";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";

type VirtualRowProps = MsaListRowProps;

function VirtualMsaRow({
  index,
  style,
  rows,
  query,
  selectedMsaId,
  hoveredMsaId,
  focusedIndex,
  expandedGroups,
  onToggleGroup,
  onNavigate,
  onHover,
}: RowComponentProps<VirtualRowProps>) {
  const row = rows[index];
  const isMsaRow = row.kind === "msa";

  return (
    <MsaSidebarRow
      row={row}
      query={query}
      isActive={isMsaRow && row.msa.id === selectedMsaId}
      isHovered={isMsaRow && row.msa.id === hoveredMsaId}
      isFocused={index === focusedIndex}
      isExpanded={row.kind === "group" ? expandedGroups[row.status] : false}
      onToggleGroup={
        row.kind === "group" ? () => onToggleGroup(row.status) : undefined
      }
      onNavigate={onNavigate}
      onHover={onHover}
      style={style}
    />
  );
}

interface MsaSidebarListProps extends MsaListRowProps {
  emptyMessage?: string;
}

export function MsaSidebarList({
  rows,
  query,
  selectedMsaId,
  hoveredMsaId,
  focusedIndex,
  expandedGroups,
  onToggleGroup,
  onNavigate,
  onHover,
  onFocusedIndexChange,
  emptyMessage = "No markets found.",
}: MsaSidebarListProps & {
  onFocusedIndexChange: (index: number) => void;
}) {
  const listRef = useListRef(null);
  const navigate = useNavigate();
  const { recordRecentMsa } = useMsaNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);

  const rowProps = useMemo(
    () => ({
      rows,
      query,
      selectedMsaId,
      hoveredMsaId,
      focusedIndex,
      expandedGroups,
      onToggleGroup,
      onNavigate,
      onHover,
    }),
    [
      rows,
      query,
      selectedMsaId,
      hoveredMsaId,
      focusedIndex,
      expandedGroups,
      onToggleGroup,
      onNavigate,
      onHover,
    ],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      setListHeight(height);
    });
    observer.observe(element);
    setListHeight(element.clientHeight);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedMsaId) return;
    const index = rows.findIndex(
      (row) => row.kind === "msa" && row.msa.id === selectedMsaId,
    );
    if (index >= 0) {
      listRef.current?.scrollToRow({ index, align: "smart", behavior: "smooth" });
    }
  }, [selectedMsaId, rows, listRef]);

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < rows.length) {
      listRef.current?.scrollToRow({ index: focusedIndex, align: "smart" });
    }
  }, [focusedIndex, rows.length, listRef]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const navigableIndices = rows
        .map((row, index) => (row.kind === "msa" ? index : -1))
        .filter((index) => index >= 0);

      if (navigableIndices.length === 0) return;

      const currentNavIndex = navigableIndices.indexOf(focusedIndex);
      const resolvedNavIndex = currentNavIndex >= 0 ? currentNavIndex : 0;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next =
          navigableIndices[Math.min(resolvedNavIndex + 1, navigableIndices.length - 1)];
        onFocusedIndexChange(next);
        const row = rows[next];
        if (row.kind === "msa") onHover(row.msa.id);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = navigableIndices[Math.max(resolvedNavIndex - 1, 0)];
        onFocusedIndexChange(prev);
        const row = rows[prev];
        if (row.kind === "msa") onHover(row.msa.id);
      }

      if (event.key === "Enter" && focusedIndex >= 0) {
        event.preventDefault();
        const row = rows[focusedIndex];
        if (row.kind === "msa") {
          recordRecentMsa(row.msa.id);
          navigate(`/msa/${row.msa.id}`);
          onNavigate?.();
        }
      }
    },
    [rows, focusedIndex, onFocusedIndexChange, onHover, onNavigate, navigate, recordRecentMsa],
  );

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-hidden outline-none"
      tabIndex={0}
      role="listbox"
      aria-label="Markets list"
      onKeyDown={handleKeyDown}
    >
      {listHeight > 0 && (
        <List
          listRef={listRef}
          rowCount={rows.length}
          rowHeight={(index) => getRowHeight(rows[index])}
          rowComponent={VirtualMsaRow}
          rowProps={rowProps}
          overscanCount={8}
          style={{ height: listHeight, width: "100%" }}
        />
      )}
    </div>
  );
}
