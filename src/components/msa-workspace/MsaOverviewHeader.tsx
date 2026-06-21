import type { MSA } from "@/types/msa";
import { MsaStatusBadge } from "@/components/MsaStatusBadge";

interface MsaOverviewHeaderProps {
  msa: MSA;
}

function geographySubtitle(msa: MSA): string {
  if (msa.id.startsWith("micro-")) return `${msa.state} · Micropolitan Statistical Area`;
  return `${msa.state} · Metropolitan Statistical Area`;
}

export function MsaOverviewHeader({ msa }: MsaOverviewHeaderProps) {
  return (
    <header className="space-y-1">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{msa.name}</h1>
        <MsaStatusBadge status={msa.status} />
      </div>
      <p className="text-sm text-muted-foreground">{geographySubtitle(msa)}</p>
    </header>
  );
}
