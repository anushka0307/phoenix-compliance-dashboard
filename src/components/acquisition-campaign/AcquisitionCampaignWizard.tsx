import { useEffect, useMemo, useState } from "react";
import type {
  CampaignAudienceFilters,
  CampaignChannelConfig,
  CampaignDraftInput,
  CampaignMessagingStep,
  CampaignObjective,
  CampaignType,
} from "@/types/acquisitionCampaign";
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_TYPES,
  CURRENT_CAMPAIGN_USER,
  MESSAGING_TEMPLATES,
  canCampaignAction,
  getObjectiveLabel,
  getCampaignTypeLabel,
  getChannelLabel,
} from "@/types/acquisitionCampaign";
import { useNavigate } from "react-router-dom";
import { usePortfolio } from "@/contexts/NetworkContext";
import { useCampaignNavigation } from "@/contexts/CampaignNavigationContext";
import { getPgAcquisitionWorkspaceWithCampaigns } from "@/utils/pgCampaignBridge";
import {
  computeAudienceMetrics,
  filterAudiencePgs,
  getCampaignById,
  getCampaignsForMsa,
  getDefaultAudienceFilters,
  getDefaultChannels,
  getDefaultMessagingSequence,
  saveCampaign,
} from "@/utils/acquisitionCampaignStore";
import { formatCurrency, formatNumber } from "@/utils/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import type { PgAcquisitionStage } from "@/types/pgAcquisition";

const SPECIALTIES = ["Primary Care", "Cardiology", "Geriatrics", "Internal Medicine", "Family Medicine"];
const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AcquisitionCampaignWizard() {
  const navigate = useNavigate();
  const { getMsa } = usePortfolio();
  const { launchContext, duplicateFromCampaignId, closeCampaignWizard } = useCampaignNavigation();
  const msa = launchContext ? getMsa(launchContext.msaId) : undefined;
  const open = launchContext !== null && msa !== undefined;

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<CampaignObjective>("pg-acquisition");
  const [owner, setOwner] = useState(CURRENT_CAMPAIGN_USER.name);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10),
  );
  const [type, setType] = useState<CampaignType>("cold-outreach");
  const [filters, setFilters] = useState<CampaignAudienceFilters>(getDefaultAudienceFilters());
  const [selectedPgIds, setSelectedPgIds] = useState<string[]>([]);
  const [channels, setChannels] = useState<CampaignChannelConfig[]>([]);
  const [sequence, setSequence] = useState<CampaignMessagingStep[]>([]);

  const workspace = useMemo(
    () => (msa ? getPgAcquisitionWorkspaceWithCampaigns(msa) : null),
    [msa],
  );
  const existingCampaigns = useMemo(
    () => (msa ? getCampaignsForMsa(msa.id) : []),
    [msa, open],
  );

  const filteredPgs = useMemo(() => {
    if (!workspace) return [];
    let pgs = filterAudiencePgs(workspace.pgs, filters);
    if (filters.counties.length > 0 && launchContext?.county) {
      // Mock county match — include all when county filter matches context
      pgs = pgs.filter(() => true);
    }
    if (launchContext?.targetPgIds?.length) {
      const fromContext = workspace.pgs.filter((pg) => launchContext.targetPgIds?.includes(pg.id));
      if (fromContext.length > 0) pgs = fromContext;
    }
    return pgs;
  }, [workspace, filters, launchContext]);

  const audienceMetrics = useMemo(
    () =>
      msa
        ? computeAudienceMetrics(
            workspace?.pgs.filter((pg) => selectedPgIds.includes(pg.id)) ?? filteredPgs,
            msa,
          )
        : { pgCount: 0, addressablePatients: 0, estimatedReferralVolume: 0, estimatedRevenueOpportunity: 0 },
    [msa, workspace, selectedPgIds, filteredPgs],
  );

  useEffect(() => {
    if (!launchContext || !msa) return;
    setStep(1);
    setName(
      launchContext.recommendationAction
        ? `${launchContext.recommendationAction.slice(0, 40)} Campaign`
        : `${msa.name.split(",")[0]} PG Acquisition`,
    );
    setObjective(launchContext.suggestedObjective ?? "pg-acquisition");
    setType(launchContext.suggestedType ?? "cold-outreach");
    setOwner(CURRENT_CAMPAIGN_USER.name);
    setFilters({
      ...getDefaultAudienceFilters(),
      counties: launchContext.county ? [launchContext.county] : [],
      specialties: launchContext.specialty ? [launchContext.specialty] : [],
      minOpportunityScore: launchContext.opportunityScoreMin ?? 0,
      acquisitionStages:
        launchContext.suggestedType === "upsell"
          ? (["active", "expansion"] as PgAcquisitionStage[])
          : launchContext.suggestedType === "cold-outreach"
            ? (["identified", "awareness"] as PgAcquisitionStage[])
            : [],
    });
    const initialIds = launchContext.targetPgIds ?? workspace?.pgs.slice(0, 4).map((pg) => pg.id) ?? [];
    setSelectedPgIds(initialIds);
    const t = launchContext.suggestedType ?? "cold-outreach";
    setSequence(getDefaultMessagingSequence(t));
    setChannels(getDefaultChannels(t, initialIds.length || 4));

    if (duplicateFromCampaignId) {
      const dup = getCampaignById(msa.id, duplicateFromCampaignId);
      if (dup) {
        setName(`${dup.name} (Copy)`);
        setObjective(dup.objective);
        setType(dup.type);
        setFilters(dup.audienceFilters);
        setSelectedPgIds(dup.targetPgIds);
        setChannels(dup.channels);
        setSequence(dup.messagingSequence);
      }
    }
  }, [launchContext, msa, duplicateFromCampaignId, workspace]);

  if (!open || !msa || !launchContext) return null;

  const workspacePgs = workspace?.pgs ?? [];

  const resetAndClose = () => {
    setStep(1);
    closeCampaignWizard();
  };

  const buildDraft = (status: CampaignDraftInput["status"]): CampaignDraftInput => ({
    name,
    objective,
    owner,
    msaId: msa.id,
    msaName: msa.name,
    startDate,
    endDate,
    type,
    source: launchContext.source,
    audienceFilters: filters,
    targetPgIds: selectedPgIds.length > 0 ? selectedPgIds : filteredPgs.map((pg) => pg.id),
    channels,
    messagingSequence: sequence,
    audienceMetrics,
    estimatedConversionRate: 12 + Math.min(18, audienceMetrics.pgCount * 2),
    estimatedPipelineValue: audienceMetrics.estimatedRevenueOpportunity,
    estimatedRevenueImpact: Math.round(audienceMetrics.estimatedRevenueOpportunity * 0.35),
    status,
  });

  const handleSaveDraft = () => {
    if (!canCampaignAction("create")) return;
    saveCampaign(buildDraft("draft"), undefined, workspacePgs);
    resetAndClose();
    navigate(`/msa/${msa.id}/campaigns`);
  };

  const handleLaunch = (scheduled: boolean) => {
    if (!canCampaignAction("launch")) return;
    const campaign = saveCampaign(
      buildDraft(scheduled ? "scheduled" : "active"),
      undefined,
      workspacePgs,
    );
    resetAndClose();
    navigate(`/msa/${msa.id}/campaigns/${campaign.id}`);
  };

  const togglePg = (pgId: string) => {
    setSelectedPgIds((prev) =>
      prev.includes(pgId) ? prev.filter((id) => id !== pgId) : [...prev, pgId],
    );
  };

  const updateFilter = <K extends keyof CampaignAudienceFilters>(
    key: K,
    value: CampaignAudienceFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleChannel = (channel: CampaignChannelConfig["channel"]) => {
    setChannels((prev) =>
      prev.map((item) =>
        item.channel === channel ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const canProceed =
    (step === 1 && name.trim() && owner.trim()) ||
    (step === 2 && audienceMetrics.pgCount > 0) ||
    (step === 3 && type) ||
    (step === 4 && channels.some((c) => c.enabled)) ||
    (step === 5 && sequence.length > 0) ||
    step === 6;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && resetAndClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Acquisition Campaign</DialogTitle>
          <DialogDescription>
            Step {step} of 6 — {msa.name}
            {launchContext.county && ` · ${launchContext.county}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <span
              key={s}
              className={cn(
                "rounded-full px-2 py-0.5",
                step === s ? "bg-primary/10 font-medium text-primary" : "",
              )}
            >
              {s === 1 && "Basics"}
              {s === 2 && "Audience"}
              {s === 3 && "Type"}
              {s === 4 && "Channels"}
              {s === 5 && "Messaging"}
              {s === 6 && "Review"}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium">Campaign name *</span>
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium">Campaign objective *</span>
              <select
                className={fieldClass}
                value={objective}
                onChange={(e) => setObjective(e.target.value as CampaignObjective)}
              >
                {CAMPAIGN_OBJECTIVES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Campaign owner *</span>
              <input className={fieldClass} value={owner} onChange={(e) => setOwner(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Target MSA</span>
              <input className={fieldClass} value={msa.name} readOnly disabled />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Start date</span>
              <input
                type="date"
                className={fieldClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">End date</span>
              <input
                type="date"
                className={fieldClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            {existingCampaigns.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium">Duplicate existing campaign</span>
                <select
                  className={fieldClass}
                  defaultValue=""
                  onChange={(e) => {
                    const source = getCampaignById(msa.id, e.target.value);
                    if (source) {
                      setName(`${source.name} (Copy)`);
                      setObjective(source.objective);
                      setType(source.type);
                      setFilters(source.audienceFilters);
                      setSelectedPgIds(source.targetPgIds);
                      setChannels(source.channels);
                      setSequence(source.messagingSequence);
                    }
                  }}
                >
                  <option value="">Select to duplicate...</option>
                  {existingCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium">County</span>
                <input
                  className={fieldClass}
                  value={filters.counties[0] ?? launchContext.county ?? ""}
                  onChange={(e) => updateFilter("counties", e.target.value ? [e.target.value] : [])}
                  placeholder="e.g. Fulton"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium">Min opportunity score</span>
                <input
                  type="number"
                  className={fieldClass}
                  value={filters.minOpportunityScore}
                  onChange={(e) => updateFilter("minOpportunityScore", Number(e.target.value))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium">Min referral volume</span>
                <input
                  type="number"
                  className={fieldClass}
                  value={filters.minReferralVolume}
                  onChange={(e) => updateFilter("minReferralVolume", Number(e.target.value))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium">Specialty</span>
                <select
                  className={fieldClass}
                  value={filters.specialties[0] ?? ""}
                  onChange={(e) =>
                    updateFilter("specialties", e.target.value ? [e.target.value] : [])
                  }
                >
                  <option value="">All specialties</option>
                  {SPECIALTIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={filters.requireHhaRelationship}
                  onChange={(e) => updateFilter("requireHhaRelationship", e.target.checked)}
                />
                HHA relationships
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={filters.competitorAffiliatedOnly}
                  onChange={(e) => updateFilter("competitorAffiliatedOnly", e.target.checked)}
                />
                Competitor affiliated
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-md border p-2 text-center text-xs">
                <p className="text-muted-foreground">PGs</p>
                <p className="text-lg font-semibold">{audienceMetrics.pgCount}</p>
              </div>
              <div className="rounded-md border p-2 text-center text-xs">
                <p className="text-muted-foreground">Patients</p>
                <p className="text-lg font-semibold">{formatNumber(audienceMetrics.addressablePatients)}</p>
              </div>
              <div className="rounded-md border p-2 text-center text-xs">
                <p className="text-muted-foreground">Referrals/mo</p>
                <p className="text-lg font-semibold">{formatNumber(audienceMetrics.estimatedReferralVolume)}</p>
              </div>
              <div className="rounded-md border p-2 text-center text-xs">
                <p className="text-muted-foreground">Revenue opp.</p>
                <p className="text-lg font-semibold">{formatCurrency(audienceMetrics.estimatedRevenueOpportunity)}</p>
              </div>
            </div>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border p-2">
              {filteredPgs.map((pg) => (
                <label key={pg.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedPgIds.includes(pg.id)}
                    onChange={() => togglePg(pg.id)}
                  />
                  <span className="font-medium">{pg.name}</span>
                  <span className="text-muted-foreground">
                    {pg.specialty} · score {pg.opportunityScore}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-2">
            {CAMPAIGN_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setType(item.id);
                  setSequence(getDefaultMessagingSequence(item.id));
                  setChannels(getDefaultChannels(item.id, audienceMetrics.pgCount || 4));
                }}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  type === item.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                )}
              >
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            {channels.map((config) => (
              <label
                key={config.channel}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => toggleChannel(config.channel)}
                  />
                  {getChannelLabel(config.channel)}
                  <Badge variant="outline" className="text-[10px]">
                    Priority {config.priority}
                  </Badge>
                </span>
                <span className="text-xs text-muted-foreground">
                  Est. reach {config.estimatedReach}
                </span>
              </label>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {MESSAGING_TEMPLATES.map((tpl) => (
                <Button
                  key={tpl.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSequence((prev) => [
                      ...prev,
                      {
                        id: `step-${prev.length + 1}`,
                        label: tpl.label,
                        channel: "email",
                        delayDays: prev.length * 5,
                        templateId: tpl.id,
                        body: tpl.body,
                      },
                    ])
                  }
                >
                  + {tpl.label}
                </Button>
              ))}
            </div>
            {sequence.map((item, index) => (
              <div key={item.id} className="rounded-md border p-2 text-xs">
                <p className="font-medium">
                  {index + 1}. {item.label} · {getChannelLabel(item.channel)} · +{item.delayDays}d
                </p>
                <p className="mt-1 text-muted-foreground">{item.body}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Variables: {"{{pgName}}"}, {"{{specialty}}"}, {"{{county}}"}, {"{{sharedHha}}"}, {"{{referralOpportunity}}"}
            </p>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3 text-sm">
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Objective</dt>
                <dd className="font-medium">{getObjectiveLabel(objective)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{getCampaignTypeLabel(type)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Audience</dt>
                <dd className="font-medium">{audienceMetrics.pgCount} PGs</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Channels</dt>
                <dd className="font-medium">
                  {channels.filter((c) => c.enabled).map((c) => getChannelLabel(c.channel)).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Est. conversion</dt>
                <dd className="font-medium">{12 + Math.min(18, audienceMetrics.pgCount * 2)}%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pipeline value</dt>
                <dd className="font-medium">{formatCurrency(audienceMetrics.estimatedRevenueOpportunity)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              {sequence.length} sequence steps configured. Mock execution will track funnel progression and attribution.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {canCampaignAction("create") && (
              <Button variant="outline" onClick={handleSaveDraft}>
                Save draft
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 6 && (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed}>
                Continue
              </Button>
            )}
            {step === 6 && canCampaignAction("launch") && (
              <>
                <Button variant="outline" onClick={() => handleLaunch(true)}>
                  Schedule launch
                </Button>
                <Button onClick={() => handleLaunch(false)}>Launch now</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
