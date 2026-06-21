export function getPartnerRetention(churnRate: number): number {
  return Math.round((100 - churnRate) * 10) / 10;
}

export function formatPartnerRetention(churnRate: number): string {
  return `${getPartnerRetention(churnRate).toFixed(1)}%`;
}

export function getMarketStrength(healthScore: number): number {
  return healthScore;
}
