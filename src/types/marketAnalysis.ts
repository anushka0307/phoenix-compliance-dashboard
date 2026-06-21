export type TrendDirection = "up" | "down" | "neutral";

export type InsightSeverity = "high" | "medium" | "low";

export type EffortLevel = "Low" | "Medium" | "High";

export type PriorityLevel = "Critical" | "High" | "Medium" | "Low";

export type CompetitorStrength = "High" | "Medium" | "Low";

export type BenchmarkStatus = "above" | "near" | "below";

export type AlertImpact = "high" | "medium" | "low";

export type AlertUrgency = "high" | "medium" | "low";

export type OpportunityQuadrant =
  | "quick-wins"
  | "strategic-bets"
  | "long-term-plays"
  | "low-priority";

export type CoverageMapLayer =
  | "patientDensity"
  | "revenueDensity"
  | "coverageGaps"
  | "opportunityScore";

export type CoveragePointType = "pg" | "hha" | "client" | "competitor";

export interface MarketAnalysisProfile {
  totalPopulation: number;
  population65Plus: number;
  medicarePopulation: number;
  populationGrowthRate: number;
  medianHouseholdIncome: number;
  chronicDiseasePrevalence: number;
  totalPhysicianGroups: number;
  totalHomeHealthAgencies: number;
  totalAddressablePatients: number;
  uncoveredZipCodes: number;
  competitorCount: number;
  marketConcentrationIndex: number;
  largestCompetitorShare: number;
  competitiveIntensityScore: number;
  annualValuePerPatient: number;
  populationGrowthTrend: TrendDirection;
  medicareGrowthTrend: TrendDirection;
  incomeTrend: TrendDirection;
  chronicDiseaseTrend: TrendDirection;
}

export interface CompetitorRecord {
  name: string;
  estimatedShare: number;
  strength: CompetitorStrength;
}

export interface EnhancedCompetitor extends CompetitorRecord {
  growthRate: number;
  estimatedPgCount: number;
  estimatedHhaCount: number;
  countiesServed: number;
  serviceLineStrengths: string[];
  geographicOverlap: number;
}

export interface OpportunitySeed {
  id: string;
  name: string;
  baseScore: number;
  estimatedRevenueImpact: number;
  effortLevel: EffortLevel;
}

export interface MarketAnalysisExecutiveKpis {
  marketOpportunityScore: number;
  totalAddressableMarket: number;
  currentMarketPenetration: number;
  annualGrowthRate: number;
  competitiveIntensity: number;
  networkRank: number;
  networkTotal: number;
  pgCoverage: number;
  hhaCoverage: number;
  revenuePerPatient: number;
}

export interface MetricDrivenInsight {
  headline: string;
  bullets: string[];
}

export interface AddressablePatientAssumptions {
  medicarePopulation: number;
  eligibilityRate: number;
  chronicCarePrevalence: number;
  serviceFitScore: number;
}

export interface MarketFundamentalsMetrics {
  totalPopulation: number;
  population65Plus: number;
  medicarePopulation: number;
  populationGrowthRate: number;
  medianHouseholdIncome: number;
  chronicDiseasePrevalence: number;
  populationGrowthTrend: TrendDirection;
  medicareGrowthTrend: TrendDirection;
  incomeTrend: TrendDirection;
  chronicDiseaseTrend: TrendDirection;
  addressablePatients: number;
  addressableAssumptions?: AddressablePatientAssumptions;
  estimatedPhysicianGroups: number;
  estimatedPhysicians: number;
  estimatedHomeHealthAgencies: number;
}

export interface ProviderLandscapeMetrics {
  totalPhysicianGroups: number;
  activePhysicianGroups: number;
  totalHomeHealthAgencies: number;
  activeHomeHealthAgencies: number;
  hhaToPgRatio: number;
  averagePatientsPerPg: number;
  pgCoverage: number;
  hhaCoverage: number;
  totalPhysicians: number;
}

export interface CoverageMetrics {
  daPatients: number;
  totalAddressablePatients: number;
  pgPenetration: number;
  patientReach: number;
  zipCoverage: number;
  referralCoverage: number;
  uncoveredZipCodes: number;
  totalZipCodes: number;
  revenuePerPatient: number;
  hhaCoverage: number;
}

export interface ZipHeatmapCell {
  zip: string;
  county: string;
  coverageGap: number;
  isCovered: boolean;
  pgPenetration: number;
  patientReach: number;
  opportunityValue: number;
  competitorDensity: number;
}

export interface PhysicianGraphNode {
  id: string;
  label: string;
  type: "partner-pg" | "target-pg" | "physician" | "competitor-pg";
}

export interface PhysicianGraphLink {
  source: string;
  target: string;
}

export interface SankeyFlowNode {
  id: string;
  label: string;
  column: number;
}

export interface SankeyFlowLink {
  source: string;
  target: string;
  value: number;
  conversionRate?: number;
  revenueImpact?: number;
}

export interface OperationalSlaMetrics {
  averageOnboardingDays: number;
  slaTargetDays: number;
  slaCompliancePercent: number;
  pgsBreachingSla: number;
  totalTrackedPgs: number;
  breachPercent: number;
}

export interface RevenueTreemapSegment {
  id: string;
  label: string;
  value: number;
}

export interface WarmAcquisitionPg {
  name: string;
  county: string;
  sharedPhysiciansWithPartner: number;
  warmIntroductionScore: number;
  referralInfluenceScore: number;
  partnerPgAffiliation: string;
  acquisitionProbability: number;
  estimatedAnnualReferrals: number;
}

export interface PhysicianNetworkIntelligence {
  sharedPhysicianCount: number;
  warmIntroductionScore: number;
  referralInfluenceScore: number;
  warmAcquisitionTargets: WarmAcquisitionPg[];
  graphNodes: PhysicianGraphNode[];
  graphLinks: PhysicianGraphLink[];
}

export interface PgAcquisitionFocus {
  targetPg: string;
  county: string;
  rationale: string;
}

export interface CompetitiveMetrics {
  competitorCount: number;
  marketConcentrationIndex: number;
  largestCompetitorShare: number;
  competitiveIntensityScore: number;
  competitors: EnhancedCompetitor[];
  overlapSummary: string;
  dominantGapZips: number;
  strongestCompetitorCounty: string;
}

export interface ScoredOpportunity {
  id: string;
  name: string;
  score: number;
  estimatedRevenueImpact: number;
  effortLevel: EffortLevel;
  priority: PriorityLevel;
  effortScore: number;
  revenueScore: number;
  quadrant: OpportunityQuadrant;
}

export interface MarketRecommendation {
  id: string;
  action: string;
  reason: string;
  expectedImpact: string;
  estimatedEffort: EffortLevel;
  relatedMetric: string;
  owner: string;
  dueDate: string;
  revenueImpact: number;
  confidence: number;
  status: string;
  requiredResources: string;
  nextSteps: string[];
}

export interface BenchmarkMetric {
  id: string;
  label: string;
  msaValue: number;
  networkAvg: number;
  topQuartile: number;
  format: "percent" | "currency" | "number" | "days";
  status: BenchmarkStatus;
}

export interface TrendMetric {
  id: string;
  label: string;
  currentValue: number;
  previousQuarter: number;
  yoyDelta: number;
  monthly: number[];
  format: "currency" | "number" | "percent";
}

export type AlertSentiment = "positive" | "warning" | "negative" | "neutral";

export interface OperationalAlert {
  id: string;
  message: string;
  sentiment: AlertSentiment;
  impact: AlertImpact;
  urgency: AlertUrgency;
}

export interface ExecutiveSummary {
  opportunityScore: number;
  totalAddressableMarket: number;
  annualGrowthRate: number;
  competitiveIntensity: number;
  expansionRecommendation: string;
}

export interface CountyCoverageRow {
  county: string;
  addressablePatients: number;
  activePatients: number;
  pgPenetration: number;
  patientReach: number;
  referralCoverage: number;
  opportunityScore: number;
  uncoveredZips: number;
  opportunityValue: number;
}

export interface CountyPenetrationBar {
  county: string;
  pgPenetration: number;
  patientReach: number;
}

export interface CompetitorOverlapCell {
  competitor: string;
  county: string;
  marketShare: number;
  overlapPercent: number;
}

export interface ReferralNetworkEdge {
  from: string;
  to: string;
  county: string;
  volume: number;
}

export interface ReferralNetworkIntelligence {
  connectedCounties: number;
  adjacentExpansionCounties: number;
  clientOverlapPercent: number;
  referralFlowVolume: number;
  warmOpportunities: string[];
  coldOutreachCounties: string[];
  edges: ReferralNetworkEdge[];
  sankeyNodes: SankeyFlowNode[];
  sankeyLinks: SankeyFlowLink[];
}

export interface PgAcquisitionTarget {
  county: string;
  targetSpecialty: string;
  estimatedPgCount: number;
  estimatedRevenue: number;
  estimatedAnnualReferrals: number;
  expectedConversionRate: number;
  revenuePerPatient: number;
  acquisitionDifficulty: "Low" | "Medium" | "High";
  priorityScore: number;
}

export interface BusinessAnalytics {
  coverage: {
    addressablePatientRatio: number;
    patientAcquisitionEfficiency: number;
    revenuePerZip: number;
    revenuePerPg: number;
    revenuePerHha: number;
  };
  market: {
    cagr: number;
    hhi: number;
    competitiveIntensity: number;
    referralLeakagePercent: number;
    whitespaceScore: number;
  };
  operational: OperationalSlaMetrics & {
    timeToFirstReferralDays: number;
    revenueRealizationLagDays: number;
  };
  risk: {
    clientConcentrationRisk: number;
    countyDependencyIndex: number;
    churnExposure: number;
    referralSourceConcentration: number;
  };
  forecast: {
    projectedTam3yr: number;
    expectedRevenueUplift: number;
    scenarioSensitivity: number;
    revenueSegments: RevenueTreemapSegment[];
  };
}

export interface CoverageIntelligence {
  countyGaps: CountyCoverageRow[];
  countyPenetration: CountyPenetrationBar[];
  penetrationTarget: number;
  zipHeatmap: ZipHeatmapCell[];
}

export interface ScenarioBaseline {
  revenue: number;
  patients: number;
  patientReach: number;
  pgPenetration: number;
  opportunityScore: number;
}

export interface DataQualityWarning {
  id: string;
  message: string;
}

export interface CoreMarketKpis {
  opportunityScore: number;
  pgPenetration: number;
  patientReach: number;
  referralCoverage: number;
  zipCoverage: number;
}

export interface MarketAnalysisWorkspace {
  pgFocus: PgAcquisitionFocus;
  coreKpis: CoreMarketKpis;
  sla: OperationalSlaMetrics;
  executiveSummary: ExecutiveSummary;
  alerts: OperationalAlert[];
  fundamentals: MarketFundamentalsMetrics;
  coverage: CoverageMetrics;
  coverageIntelligence: CoverageIntelligence;
  businessAnalytics: BusinessAnalytics;
  competitive: CompetitiveMetrics;
  physicianNetwork: PhysicianNetworkIntelligence;
  referralNetwork: ReferralNetworkIntelligence;
  pgAcquisitionTargets: PgAcquisitionTarget[];
  opportunityScore: number;
  opportunities: ScoredOpportunity[];
  trends: TrendMetric[];
  scenarioBaseline: ScenarioBaseline;
  recommendations: MarketRecommendation[];
}

/** @deprecated Use MetricDrivenInsight */
export interface MarketAnalysisInsight {
  id: string;
  message: string;
  severity: InsightSeverity;
}

/** @deprecated Use MarketAnalysisWorkspace */
export interface MarketAnalysisReport {
  executiveKpis: MarketAnalysisExecutiveKpis;
  insights: MarketAnalysisInsight[];
  fundamentals: MarketFundamentalsMetrics;
  providerLandscape: ProviderLandscapeMetrics;
  coverage: CoverageMetrics;
  competitive: CompetitiveMetrics;
  opportunityScore: number;
  opportunities: ScoredOpportunity[];
  recommendations: MarketRecommendation[];
}
