import { useMsa } from "@/hooks/useMsa";
import { PgAcquisitionDashboard } from "@/components/pg-acquisition/PgAcquisitionDashboard";

export function PgAcquisitionPage() {
  const { msa } = useMsa();

  if (!msa) return null;

  return <PgAcquisitionDashboard msa={msa} />;
}
