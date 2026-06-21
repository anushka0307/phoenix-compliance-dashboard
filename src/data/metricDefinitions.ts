/** Central metric definitions for tooltips and transparency */

export interface MetricDefinition {
  label: string;
  definition: string;
  formula?: string;
  relevance: string;
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  opportunityScore: {
    label: "Opportunity Score",
    definition: "Composite index ranking market attractiveness for PG acquisition.",
    formula:
      "0.35 × market size + 0.25 × referral access + 0.20 × competitor gap + 0.20 × acquisition ease",
    relevance: "Higher scores indicate markets where expansion ROI is strongest.",
  },
  pgPenetration: {
    label: "PG Penetration",
    definition: "Share of addressable physician groups already partnered.",
    formula: "Acquired PGs ÷ Total addressable PGs × 100",
    relevance: "Measures structural coverage of the physician referral network.",
  },
  patientReach: {
    label: "Patient Reach",
    definition:
      "Share of addressable patients reachable through partnered PG referral networks.",
    formula:
      "min(Active patients served ÷ Addressable patients, PG penetration) × 100",
    relevance:
      "Tracks indirect patient access via partnered physician groups; never exceeds PG penetration.",
  },
  zipCoverage: {
    label: "ZIP Coverage",
    definition: "Share of ZIP codes with active PG or referral coverage.",
    formula: "Covered ZIPs ÷ Total addressable ZIPs × 100",
    relevance: "Identifies geographic gaps in market presence.",
  },
  referralCoverage: {
    label: "Referral Coverage",
    definition: "Share of active referral pathways from partner PGs.",
    formula: "Active referral pathways ÷ Total addressable pathways × 100",
    relevance: "Measures referral network completeness.",
  },
  addressablePatients: {
    label: "Addressable Patients",
    definition: "Patients eligible and likely to need home health services.",
    formula:
      "Medicare population × eligibility rate × chronic care prevalence × service fit score",
    relevance: "Defines the realistic patient pool for acquisition planning.",
  },
  whitespaceScore: {
    label: "White-space Score",
    definition: "Remaining uncaptured market potential.",
    formula: "100 − Patient reach",
    relevance: "Identifies room for growth before saturation.",
  },
  referralLeakage: {
    label: "Referral Leakage",
    definition: "Referrals sent to non-partner providers.",
    formula: "Leaked referrals ÷ Total referrals × 100",
    relevance: "High leakage signals partnership gaps to close.",
  },
  warmIntroductionScore: {
    label: "Warm Introduction Score",
    definition: "Likelihood of a warm intro via shared physicians.",
    formula: "Shared physicians × referral influence × historical conversion probability",
    relevance: "Prioritizes PGs reachable through existing relationships.",
  },
  patientAcquisitionEfficiency: {
    label: "Patient Acquisition Efficiency",
    definition: "Effectiveness converting referrals to active patients.",
    formula: "New patients ÷ Qualified referrals × 100",
    relevance: "Measures funnel performance after PG partnerships.",
  },
  countyDependencyIndex: {
    label: "County Dependency Index",
    definition: "Revenue concentration in top counties.",
    formula: "Top 3 counties' revenue ÷ Total revenue × 100",
    relevance: "High dependency increases geographic risk.",
  },
  hhi: {
    label: "Market Concentration (HHI)",
    definition: "Herfindahl-Hirschman Index of competitor market share.",
    formula: "Σ (competitor share²)",
    relevance: "Higher HHI means fewer dominant competitors.",
  },
  scenarioSensitivity: {
    label: "Scenario Sensitivity",
    definition: "Revenue volatility under operational changes.",
    formula: "Projected revenue range ÷ baseline revenue",
    relevance: "Helps stress-test acquisition assumptions.",
  },
  slaCompliance: {
    label: "SLA Compliance",
    definition: "PG onboardings completed within the target timeframe.",
    formula: "PGs meeting SLA ÷ Total onboarded PGs × 100",
    relevance: "On-time onboarding accelerates revenue realization.",
  },
};
