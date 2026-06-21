interface PgAcquisitionCalloutProps {
  insight: string;
}

export function PgAcquisitionCallout({ insight }: PgAcquisitionCalloutProps) {
  return (
    <div className="mt-4 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
        Which PG should we acquire next?
      </p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-950">{insight}</p>
    </div>
  );
}
