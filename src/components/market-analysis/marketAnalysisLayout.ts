/** Consistent spacing for Market Analysis layout */
export const maPage = "space-y-4";
export const maGroup = "space-y-5";
export const maSection = "space-y-4";
export const maGrid = "gap-3";
export const maGridWide = "gap-4";

export type MarketAnalysisEmphasis = "primary" | "secondary" | "tertiary" | "utility";

export const maEmphasis = {
  primary: {
    section: "rounded-xl border border-primary/20 bg-primary/5",
    title: "text-base font-semibold text-foreground",
    subtitle: "text-sm text-foreground/80",
  },
  secondary: {
    section: "",
    title: "text-sm font-semibold text-foreground",
    subtitle: "text-sm text-muted-foreground",
  },
  tertiary: {
    section: "",
    title: "text-sm font-semibold text-foreground",
    subtitle: "text-xs text-muted-foreground",
  },
  utility: {
    section: "rounded-lg border border-border bg-muted/20",
    title: "text-sm font-medium text-muted-foreground",
    subtitle: "text-xs text-muted-foreground",
  },
} as const;
