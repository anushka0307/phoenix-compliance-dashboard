import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";

interface MsaTab {
  label: string;
  to: string;
  end?: boolean;
}

interface MsaTabsProps {
  msaId: string;
}

const tabs: Omit<MsaTab, "to">[] = [
  { label: "Overview", end: true },
  { label: "Market Analysis" },
  { label: "PG Acquisition" },
  { label: "Customer Success" },
];

function getTabPath(msaId: string, index: number): string {
  const paths = [
    `/msa/${msaId}`,
    `/msa/${msaId}/market-analysis`,
    `/msa/${msaId}/pg-acquisition`,
    `/msa/${msaId}/customer-success`,
  ];
  return paths[index];
}

export function MsaTabs({ msaId }: MsaTabsProps) {
  return (
    <div className="overflow-x-auto">
      <nav
        className="inline-flex h-10 items-center gap-1 rounded-lg bg-muted p-1"
        aria-label="MSA workspace tabs"
      >
        {tabs.map((tab, index) => (
          <NavLink
            key={tab.label}
            to={getTabPath(msaId, index)}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
