import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface LifecycleGateProps {
  available: boolean;
  message?: string;
  children: ReactNode;
  className?: string;
}

export function LifecycleGate({ available, message, children, className }: LifecycleGateProps) {
  if (available) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
