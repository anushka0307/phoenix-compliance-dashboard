import { Link } from "react-router-dom";
import { mockMsas } from "@/data/mockMsas";
import { useMsaNavigation } from "@/contexts/MsaNavigationContext";
import { getShortMarketName } from "@/utils/msaStatus";

interface RecentMarketsProps {
  onNavigate?: () => void;
}

export function RecentMarkets({ onNavigate }: RecentMarketsProps) {
  const { recentMsaIds } = useMsaNavigation();

  const recentMsas = recentMsaIds
    .map((id) => mockMsas.find((msa) => msa.id === id))
    .filter((msa): msa is NonNullable<typeof msa> => Boolean(msa))
    .slice(0, 3);

  if (recentMsas.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Recent
      </p>
      <ul className="space-y-0">
        {recentMsas.map((msa) => (
          <li key={msa.id}>
            <Link
              to={`/msa/${msa.id}`}
              onClick={onNavigate}
              className="block truncate rounded px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              {getShortMarketName(msa.name)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
