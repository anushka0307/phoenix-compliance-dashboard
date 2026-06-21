import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { MarketAnalysisEmphasis } from "@/components/market-analysis/marketAnalysisLayout";
import { maEmphasis, maSection } from "@/components/market-analysis/marketAnalysisLayout";

interface MarketAnalysisSectionProps {
  title: string;
  subtitle?: string;
  emphasis?: MarketAnalysisEmphasis;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function MarketAnalysisSection({
  title,
  subtitle,
  emphasis = "tertiary",
  children,
  className,
  compact,
}: MarketAnalysisSectionProps) {
  const styles = maEmphasis[emphasis];

  return (
    <section
      className={cn(
        maSection,
        styles.section,
        compact ? "p-4" : emphasis === "primary" && "p-5",
        className,
      )}
    >
      <div>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={cn("mt-0.5", styles.subtitle)}>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

interface MarketAnalysisGroupProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}

export function MarketAnalysisGroup({
  title,
  subtitle,
  children,
  className,
}: MarketAnalysisGroupProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

interface MarketAnalysisAccordionProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function MarketAnalysisAccordion({
  title,
  description,
  children,
  defaultOpen = false,
}: MarketAnalysisAccordionProps) {
  return (
    <details
      className="group rounded-lg border border-border bg-card"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block">{title}</span>
          {description && (
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              {description}
            </span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
