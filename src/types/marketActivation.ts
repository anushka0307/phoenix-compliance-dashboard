export interface MarketActivationContext {
  msaId: string;
  msaName: string;
  state: string;
  population: number;
  opportunityScore: number;
  addressablePatients: number;
  tam: number;
  zipCoverage: number;
  referralCoverage: number;
  competitiveIntensity: number;
}
