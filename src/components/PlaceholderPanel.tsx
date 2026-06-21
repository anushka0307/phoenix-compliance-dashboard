import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface PlaceholderPanelProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
  minHeight?: string;
}

export function PlaceholderPanel({
  title,
  description,
  icon,
  className,
  minHeight = "min-h-[200px]",
}: PlaceholderPanelProps) {
  return (
    <Card className={cn(minHeight, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
        {icon && (
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
