/**
 * Step 5 — Lead Scoring (0-100 motivation score).
 * Extends src/lib/scoring.ts weights with the full factor list from the prompt:
 * equity, delinquent taxes, foreclosure stage, vacancy, probate, multiple liens,
 * bankruptcy, ownership length, absentee ownership, condition indicators.
 */

import { Lead } from './types';

export function scoreLead(lead: Lead): number {
  let score = 0;
  const has = (c: string) => lead.categories.includes(c as never);

  // Foreclosure stage (0-32)
  if (has('foreclosure') || has('sheriff_sale')) score += 32;
  else if (has('tax_deed')) score += 28;
  else if (has('pre_foreclosure')) score += 22;

  // Tax distress (0-18)
  if (has('tax_delinquent')) score += 10;
  if (has('tax_lien')) score += 8;

  // Probate / inheritance (0-16)
  if (has('probate')) score += 12;
  if (has('inherited') || has('estate_sale')) score += 4;

  // Bankruptcy (0-10)
  if (has('bankruptcy')) score += 10;

  // Vacancy & condition (0-12)
  if (has('vacant')) score += 8;
  if (has('code_violation')) score += 4;

  // Equity (0-14) — high equity means a deal is actually possible
  if (lead.equityPercent !== null) {
    if (lead.equityPercent >= 70) score += 14;
    else if (lead.equityPercent >= 50) score += 10;
    else if (lead.equityPercent >= 30) score += 6;
    else if (lead.equityPercent >= 10) score += 2;
  }

  // Absentee / ownership length (0-8)
  if (has('absentee_owner')) score += 4;
  if (lead.yearsOwned !== null && lead.yearsOwned >= 15) score += 4;
  else if (lead.yearsOwned !== null && lead.yearsOwned >= 8) score += 2;

  // Stacked distress: multiple liens & many categories (0-8)
  if (lead.lienCount >= 2) score += 4;
  if (lead.categories.length >= 4) score += 4;
  else if (lead.categories.length >= 3) score += 2;

  // Minor signals
  if (has('hoa_lien')) score += 2;
  if (has('utility_delinquent')) score += 2;

  return Math.min(100, Math.round(score));
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Ultra Motivated';
  if (score >= 60) return 'High Motivation';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Low';
  return 'Standard';
}
