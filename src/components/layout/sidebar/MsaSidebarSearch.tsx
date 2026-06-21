import { Search, X } from "lucide-react";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";
import { cn } from "@/utils/cn";

interface MsaSidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  className?: string;
}

export function MsaSidebarSearch({
  value,
  onChange,
  onClear,
  className,
}: MsaSidebarSearchProps) {
  const { searchInputRef } = useMsaNavigation();

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        ref={searchInputRef}
        id="msa-market-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClear();
            searchInputRef.current?.blur();
          }
        }}
        placeholder="Search markets..."
        className="h-8 w-full min-w-0 rounded-md border border-input bg-background py-1 pl-8 pr-8 text-xs outline-none ring-offset-background transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Search markets"
        autoComplete="off"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
