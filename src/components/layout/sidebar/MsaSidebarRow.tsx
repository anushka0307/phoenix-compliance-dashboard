import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MSA } from "@/types/msa";
import { MsaStatusBadge } from "@/components/MsaStatusBadge";
import { HighlightText } from "@/components/layout/sidebar/HighlightText";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";
import { formatCurrency, formatNumber } from "@/utils/format";
import { getMsaStatusLabel, msaStatusMapColors } from "@/utils/msaStatus";
import type { SidebarRow } from "@/utils/sidebarRows";
import { cn } from "@/utils/cn";

interface MsaSidebarRowProps {
  row: SidebarRow;
  query: string;
  isActive: boolean;
  isHovered: boolean;
  isFocused: boolean;
  isExpanded: boolean;
  onToggleGroup?: () => void;
  onNavigate?: () => void;
  onHover?: (msaId: string | null) => void;
  style?: React.CSSProperties;
  ariaAttributes?: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
}

export function MsaSidebarRow({
  row,
  query,
  isActive,
  isHovered,
  isFocused,
  isExpanded,
  onToggleGroup,
  onNavigate,
  onHover,
  style,
  ariaAttributes,
}: MsaSidebarRowProps) {
  const navigate = useNavigate();
  const { recordRecentMsa } = useMsaNavigation();

  if (row.kind === "group") {
    const statusColor = msaStatusMapColors[row.status];

    return (
      <div style={style} {...ariaAttributes}>
        <button
          type="button"
          onClick={onToggleGroup}
          className="flex w-full items-center gap-1 px-1 py-0.5 text-left text-sm font-semibold leading-tight text-foreground hover:text-primary"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
          )}
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: statusColor }}
            aria-hidden
          />
          <span className="truncate">{getMsaStatusLabel(row.status)}</span>
          <span className="ml-auto tabular-nums text-muted-foreground">({row.count})</span>
        </button>
      </div>
    );
  }

  const { msa } = row;

  const openMarket = () => {
    recordRecentMsa(msa.id);
    navigate(`/msa/${msa.id}`);
    onNavigate?.();
  };

  const hoverTitle =
    msa.patients > 0
      ? `${msa.name} · ${formatNumber(msa.patients)} patients managed`
      : msa.name;

  return (
    <div style={style} {...ariaAttributes} className="px-0.5">
      <button
        type="button"
        onClick={openMarket}
        onMouseEnter={() => onHover?.(msa.id)}
        onMouseLeave={() => onHover?.(null)}
        onFocus={() => onHover?.(msa.id)}
        onBlur={() => onHover?.(null)}
        title={hoverTitle}
        className={cn(
          "flex w-full flex-col gap-0.5 rounded-md px-1.5 py-1 text-left transition-colors",
          msa.status === "inactive" && "opacity-75",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "bg-primary/10 ring-1 ring-primary/20",
          isHovered && !isActive && "bg-sidebar-accent",
          isFocused && !isActive && "bg-sidebar-accent/80",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex min-w-0 items-center justify-between gap-1">
          <p
            className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium leading-tight text-foreground"
            style={{ fontSize: "0.875rem" }}
          >
            <HighlightText text={msa.name} query={query} />
          </p>
          <MsaStatusBadge status={msa.status} compact />
        </div>
        <p
          className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap leading-tight text-muted-foreground"
          style={{ fontSize: "0.82rem" }}
        >
          <HighlightText text={msa.state} query={query} />
          {msa.healthScore > 0 && (
            <>
              <span aria-hidden> • </span>
              <span>S{msa.healthScore}</span>
            </>
          )}
          {msa.revenue > 0 && (
            <>
              <span aria-hidden> • </span>
              <span>{formatCurrency(msa.revenue)}</span>
            </>
          )}
        </p>
      </button>
    </div>
  );
}

export type MsaListRowProps = {
  rows: SidebarRow[];
  query: string;
  selectedMsaId: string | null;
  hoveredMsaId: string | null;
  focusedIndex: number;
  expandedGroups: Record<MSA["status"], boolean>;
  onToggleGroup: (status: MSA["status"]) => void;
  onNavigate?: () => void;
  onHover: (msaId: string | null) => void;
};
