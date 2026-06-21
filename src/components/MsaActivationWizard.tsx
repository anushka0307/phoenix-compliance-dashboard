import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MSA } from "@/types/msa";
import type {
  HhaRelationshipInput,
  HhaRelationshipStrength,
  MarketActivationPayload,
  PhysicianGroupActivationInput,
} from "@/types/pgAcquisition";
import { useNetwork } from "@/contexts/NetworkContext";
import { usePortfolio } from "@/contexts/NetworkContext";
import { buildMarketActivationContext } from "@/utils/marketActivationContext";
import { searchMockHhas } from "@/utils/pgAcquisitionStore";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface MsaActivationWizardProps {
  msa: MSA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_PG: PhysicianGroupActivationInput = {
  pgName: "",
  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  specialty: "Primary Care",
  activeHomeHealthPatients: 0,
  estimatedMonthlyReferralVolume: 0,
  notes: "",
};

const STRENGTH_OPTIONS: HhaRelationshipStrength[] = ["Strong", "Moderate", "Weak", "Unknown"];

export function MsaActivationWizard({ msa, open, onOpenChange }: MsaActivationWizardProps) {
  const navigate = useNavigate();
  const { activateMarket } = useNetwork();
  const { dashboardMsas } = usePortfolio();
  const [step, setStep] = useState(1);
  const [pg, setPg] = useState<PhysicianGroupActivationInput>(EMPTY_PG);
  const [hhaSearch, setHhaSearch] = useState("");
  const [hhaRelationships, setHhaRelationships] = useState<HhaRelationshipInput[]>([]);

  const context = useMemo(
    () => (msa ? buildMarketActivationContext(msa, dashboardMsas) : null),
    [msa, dashboardMsas],
  );

  const hhaResults = useMemo(
    () => (msa ? searchMockHhas(hhaSearch, msa.state) : []),
    [hhaSearch, msa],
  );

  if (!msa || !context) return null;

  const resetAndClose = () => {
    setStep(1);
    setPg(EMPTY_PG);
    setHhaSearch("");
    setHhaRelationships([]);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStep(1);
      setPg(EMPTY_PG);
      setHhaRelationships([]);
      setHhaSearch("");
    } else {
      resetAndClose();
    }
    onOpenChange(next);
  };

  const updatePg = <K extends keyof PhysicianGroupActivationInput>(
    key: K,
    value: PhysicianGroupActivationInput[K],
  ) => {
    setPg((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedStep1 =
    pg.pgName.trim() &&
    pg.primaryContactName.trim() &&
    pg.primaryContactEmail.trim() &&
    pg.primaryContactPhone.trim() &&
    pg.specialty.trim() &&
    pg.activeHomeHealthPatients > 0 &&
    pg.estimatedMonthlyReferralVolume > 0;

  const addHha = (hhaId: string, hhaName: string) => {
    if (hhaRelationships.some((item) => item.hhaId === hhaId)) return;
    setHhaRelationships((prev) => [
      ...prev,
      { hhaId, hhaName, relationshipStrength: "Moderate", notes: "" },
    ]);
  };

  const updateHha = (hhaId: string, patch: Partial<HhaRelationshipInput>) => {
    setHhaRelationships((prev) =>
      prev.map((item) => (item.hhaId === hhaId ? { ...item, ...patch } : item)),
    );
  };

  const removeHha = (hhaId: string) => {
    setHhaRelationships((prev) => prev.filter((item) => item.hhaId !== hhaId));
  };

  const handleActivate = () => {
    const payload: MarketActivationPayload = { physicianGroup: pg, hhaRelationships };
    activateMarket(msa.id, payload);
    resetAndClose();
    navigate(`/msa/${msa.id}/pg-acquisition`);
  };

  const fieldClass =
    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 3 ? "Confirm Activation" : `Activate ${context.msaName}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Physician group information for the selected market."}
            {step === 2 && "Associate home health agencies with this activation."}
            {step === 3 && "Review and confirm market activation."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{context.msaName}</p>
          <p>{context.state} · Population {formatNumber(context.population)}</p>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={cn(
                "rounded-full px-2 py-0.5",
                step === s ? "bg-primary/10 font-medium text-primary" : "",
              )}
            >
              Step {s}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="grid max-h-[50vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium">PG Name *</span>
              <input className={fieldClass} value={pg.pgName} onChange={(e) => updatePg("pgName", e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Primary Contact Name *</span>
              <input
                className={fieldClass}
                value={pg.primaryContactName}
                onChange={(e) => updatePg("primaryContactName", e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Primary Contact Email *</span>
              <input
                type="email"
                className={fieldClass}
                value={pg.primaryContactEmail}
                onChange={(e) => updatePg("primaryContactEmail", e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Primary Contact Phone *</span>
              <input
                className={fieldClass}
                value={pg.primaryContactPhone}
                onChange={(e) => updatePg("primaryContactPhone", e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Specialty *</span>
              <select
                className={fieldClass}
                value={pg.specialty}
                onChange={(e) => updatePg("specialty", e.target.value)}
              >
                {["Primary Care", "Cardiology", "Geriatrics", "Internal Medicine", "Family Medicine"].map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Active HH Patients Managed *</span>
              <input
                type="number"
                className={fieldClass}
                value={pg.activeHomeHealthPatients || ""}
                onChange={(e) => updatePg("activeHomeHealthPatients", Number(e.target.value))}
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium">Est. Monthly Referral Volume *</span>
              <input
                type="number"
                className={fieldClass}
                value={pg.estimatedMonthlyReferralVolume || ""}
                onChange={(e) => updatePg("estimatedMonthlyReferralVolume", Number(e.target.value))}
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium">Notes</span>
              <textarea
                className={cn(fieldClass, "min-h-[72px] py-2")}
                value={pg.notes}
                onChange={(e) => updatePg("notes", e.target.value)}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="space-y-1">
              <span className="text-xs font-medium">Search HHAs</span>
              <input
                className={fieldClass}
                value={hhaSearch}
                onChange={(e) => setHhaSearch(e.target.value)}
                placeholder="Search agencies..."
              />
            </label>
            <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {hhaResults.map((hha) => (
                <button
                  key={hha.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-muted"
                  onClick={() => addHha(hha.id, hha.name)}
                >
                  <span>{hha.name}</span>
                  <span className="text-muted-foreground">Add</span>
                </button>
              ))}
            </div>
            {hhaRelationships.length === 0 ? (
              <p className="text-xs text-muted-foreground">No agencies selected yet.</p>
            ) : (
              <div className="space-y-2">
                {hhaRelationships.map((rel) => (
                  <div key={rel.hhaId} className="rounded-md border border-border p-2 text-xs">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{rel.hhaName}</span>
                      <button type="button" className="text-muted-foreground" onClick={() => removeHha(rel.hhaId)}>
                        Remove
                      </button>
                    </div>
                    <label className="mb-1 block space-y-1">
                      <span>Relationship strength</span>
                      <select
                        className={fieldClass}
                        value={rel.relationshipStrength}
                        onChange={(e) =>
                          updateHha(rel.hhaId, {
                            relationshipStrength: e.target.value as HhaRelationshipStrength,
                          })
                        }
                      >
                        {STRENGTH_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      className={fieldClass}
                      placeholder="Relationship notes (optional)"
                      value={rel.notes ?? ""}
                      onChange={(e) => updateHha(rel.hhaId, { notes: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto text-sm">
            <div className="rounded-md border border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">MSA details</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Market: {context.msaName}</li>
                <li>State: {context.state}</li>
                <li>Opportunity score: {Math.round(context.opportunityScore)}</li>
                <li>Addressable patients: {formatNumber(context.addressablePatients)}</li>
                <li>TAM: {formatCurrency(context.tam)}</li>
                <li>ZIP coverage: {formatPercent(context.zipCoverage)}</li>
                <li>Referral coverage: {formatPercent(context.referralCoverage)}</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">PG details</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Name: {pg.pgName}</li>
                <li>Contact: {pg.primaryContactName}</li>
                <li>Specialty: {pg.specialty}</li>
                <li>HH patients: {formatNumber(pg.activeHomeHealthPatients)}</li>
                <li>Monthly referrals: {formatNumber(pg.estimatedMonthlyReferralVolume)}</li>
              </ul>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Selected HHAs</p>
              {hhaRelationships.length === 0 ? (
                <p className="text-xs text-muted-foreground">No agencies linked.</p>
              ) : (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {hhaRelationships.map((rel) => (
                    <li key={rel.hhaId}>
                      {rel.hhaName} · {rel.relationshipStrength}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              On confirmation, the market activates, the PG is created in Onboarding, agencies are linked,
              and campaign creation is enabled.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 3 && (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !canProceedStep1}>
              Continue
            </Button>
          )}
          {step === 3 && <Button onClick={handleActivate}>Activate MSA</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
