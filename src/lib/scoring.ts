/**
 * Lead Scoring Engine for HYDRASCOUT
 * Calculates a motivation score (0-100) based on distressed property indicators.
 */

export interface ScoringWeights {
  equity: number;
  foreclosure: number;
  taxDelinquency: number;
  vacancy: number;
  absentee: number;
  probate: number;
  bankruptcy: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  equity: 20,          // Up to 20 points for high equity
  foreclosure: 40,     // Up to 40 points for foreclosure stage
  taxDelinquency: 20,  // Up to 20 points for tax issues
  vacancy: 10,         // Up to 10 points for vacancy
  absentee: 10,        // Up to 10 points for absentee owner
  probate: 30,         // Bonus points for probate (usually very motivated)
  bankruptcy: 30,      // Bonus points for bankruptcy
};

export function calculateMotivationScore(property: any): number {
  let score = 0;

  // 1. Equity Score (0-20)
  // Higher equity % = higher motivation (usually)
  if (property.equity_percent) {
    if (property.equity_percent >= 70) score += DEFAULT_WEIGHTS.equity;
    else if (property.equity_percent >= 50) score += DEFAULT_WEIGHTS.equity * 0.75;
    else if (property.equity_percent >= 30) score += DEFAULT_WEIGHTS.equity * 0.5;
    else if (property.equity_percent >= 10) score += DEFAULT_WEIGHTS.equity * 0.25;
  }

  // 2. Foreclosure Stage (0-40)
  if (property.listing_status) {
    switch (property.listing_status) {
      case 'foreclosure':
        score += DEFAULT_WEIGHTS.foreclosure;
        break;
      case 'auction':
        score += DEFAULT_WEIGHTS.foreclosure * 0.8;
        break;
      case 'pre_foreclosure':
        score += DEFAULT_WEIGHTS.foreclosure * 0.6;
        break;
      case 'reo':
        score += DEFAULT_WEIGHTS.foreclosure * 0.4;
        break;
    }
  }

  // 3. Tax Delinquency (0-20)
  if (property.tax_delinquency === true) {
    score += DEFAULT_WEIGHTS.taxDelinquency;
  }

  // 4. Vacancy / Absentee (0-10)
  if (property.owner_type === 'absentee') {
    score += DEFAULT_WEIGHTS.absentee;
  }

  // If we have a specific vacancy flag (future expansion)
  if (property.is_vacant === true) {
    score += DEFAULT_WEIGHTS.vacancy;
  }

  // 5. Special High-Motivation Indicators (Bonuses)
  // These are usually binary but highly motivated
  if (property.is_probate === true) {
    score += DEFAULT_WEIGHTS.probate;
  }
  if (property.is_bankruptcy === true) {
    score += DEFAULT_WEIGHTS.bankruptcy;
  }

  // Cap the score at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Returns a human-readable label based on the score
 */
export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Ultra Motivated', color: 'text-red-600' };
  if (score >= 60) return { label: 'High Motivation', color: 'text-orange-500' };
  if (score >= 40) return { label: 'Moderate', color: 'text-yellow-600' };
  if (score >= 20) return { label: 'Low Motivation', color: 'text-blue-500' };
  return { label: 'Standard', color: 'text-muted-foreground' };
}
