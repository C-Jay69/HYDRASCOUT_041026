/**
 * Disposition module — buyer network & lead ↔ buyer matching.
 *
 * Buyers are real-estate investors with a defined buy-box (markets, price
 * range, property types, financing, rehab budget). The matching engine
 * scores every buyer 0–100+ against a converted lead:
 *
 *   Location fit ............ up to 30 pts
 *   Price-range fit ......... up to 25 pts
 *   Property-type fit ....... up to 15 pts
 *   Equity fit .............. up to 15 pts
 *   Financing strength ...... up to  5 pts
 *   Distress/rehab fit ...... up to 10 pts + up to 10 urgency bonus
 *
 * Scores above 100 are possible when a buyer's buy-box aligns perfectly
 * with a time-sensitive lead (e.g. auction scheduled).
 */

import { Buyer, BuyerMatch, Lead } from './types';
import { uid } from './rng';

export const PROPERTY_TYPES = [
  'Single Family',
  'Townhouse',
  'Condo',
  'Duplex',
  'Multi-Family',
  'Mobile Home',
  'Land',
  'Commercial',
];

/** Factory helper — create a fully-formed Buyer from a partial payload. */
export function newBuyer(partial: Partial<Buyer> = {}): Buyer {
  const now = new Date().toISOString();
  return {
    id: partial.id || uid('buyer_'),
    name: partial.name || '',
    company: partial.company || '',
    email: partial.email || '',
    phone: partial.phone || '',
    markets: partial.markets ?? [],
    minPrice: partial.minPrice ?? null,
    maxPrice: partial.maxPrice ?? null,
    propertyTypes: partial.propertyTypes ?? [],
    financing: partial.financing || 'either',
    minEquityPercent: partial.minEquityPercent ?? null,
    maxRehabBudget: partial.maxRehabBudget ?? null,
    active: partial.active ?? true,
    notes: partial.notes || '',
    dealsClosed: partial.dealsClosed ?? 0,
    createdAt: partial.createdAt || now,
    updatedAt: now,
  };
}

const STATE_NAMES: Record<string, string> = {
  AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california', CO: 'colorado',
  CT: 'connecticut', DE: 'delaware', FL: 'florida', GA: 'georgia', HI: 'hawaii', ID: 'idaho',
  IL: 'illinois', IN: 'indiana', IA: 'iowa', KS: 'kansas', KY: 'kentucky', LA: 'louisiana',
  ME: 'maine', MD: 'maryland', MA: 'massachusetts', MI: 'michigan', MN: 'minnesota', MS: 'mississippi',
  MO: 'missouri', MT: 'montana', NE: 'nebraska', NV: 'nevada', NH: 'new hampshire', NJ: 'new jersey',
  NM: 'new mexico', NY: 'new york', NC: 'north carolina', ND: 'north dakota', OH: 'ohio', OK: 'oklahoma',
  OR: 'oregon', PA: 'pennsylvania', RI: 'rhode island', SC: 'south carolina', SD: 'south dakota',
  TN: 'tennessee', TX: 'texas', UT: 'utah', VT: 'vermont', VA: 'virginia', WA: 'washington',
  WV: 'west virginia', WI: 'wisconsin', WY: 'wyoming', DC: 'district of columbia',
};

/** Normalize a market entry for comparison: "Dallas, TX" → ["dallas", "tx"]. */
function marketTokens(market: string): string[] {
  return market.toLowerCase().split(/[,/]+/).map((s) => s.replace(/county|metro|area/g, '').trim()).filter(Boolean);
}

function locationScore(lead: Lead, buyer: Buyer): { points: number; reasons: string[] } {
  const markets = buyer.markets.map((m) => m.trim().toLowerCase()).filter(Boolean);
  if (!markets.length || markets.includes('all') || markets.includes('usa')) {
    return { points: 15, reasons: ['Buys nationwide (any market)'] };
  }
  const stateCode = lead.state.toLowerCase();
  const stateName = STATE_NAMES[lead.state.toUpperCase()] || '';
  const city = (lead.city || '').toLowerCase();
  const county = `${(lead.county || '').toLowerCase()} county`;

  let best = 0;
  const reasons: string[] = [];
  for (const market of markets) {
    const tokens = marketTokens(market);
    for (const t of tokens) {
      if (t === stateCode || (stateName && t === stateName)) {
        if (best < 15) {
          best = 15;
          reasons.length = 0;
          reasons.push(`Market match: ${market.toUpperCase() === market ? market : market.replace(/\b\w/g, (c) => c.toUpperCase())}`);
        }
      }
      if (t === city || county === t || county.startsWith(t) || t.startsWith(city)) {
        // City or county level match beats a bare state match
        best = 30;
        reasons.length = 0;
        reasons.push(`Exact market: ${market.replace(/\b\w/g, (c) => c.toUpperCase())}`);
      }
    }
  }
  if (best === 0) {
    return { points: 0, reasons: [`Outside buyer's markets (${buyer.markets.slice(0, 3).join(', ')})`] };
  }
  return { points: best, reasons };
}

function priceScore(lead: Lead, buyer: Buyer): { points: number; reasons: string[] } {
  const value = lead.marketValue ?? lead.assessedValue;
  if (value === null || value === undefined) {
    return { points: 10, reasons: ['No valuation on file — price fit unknown'] };
  }
  if (buyer.minPrice === null && buyer.maxPrice === null) {
    return { points: 15, reasons: [`No price constraints (lead value ~$${Math.round(value).toLocaleString()})`] };
  }
  const min = buyer.minPrice ?? -Infinity;
  const max = buyer.maxPrice ?? Infinity;
  if (value >= min && value <= max) {
    return {
      points: 25,
      reasons: [`Price fit: $${Math.round(value).toLocaleString()} within $${(buyer.minPrice ?? 0).toLocaleString()}–$${(buyer.maxPrice ?? 0).toLocaleString()}`],
    };
  }
  // Within 10% of the range boundary — partial credit
  const nearMin = min !== -Infinity && value < min && value >= min * 0.9;
  const nearMax = max !== Infinity && value > max && value <= max * 1.1;
  if (nearMin || nearMax) {
    return {
      points: 12,
      reasons: [`Price near range edge: $${Math.round(value).toLocaleString()} vs $${(buyer.minPrice ?? 0).toLocaleString()}–$${(buyer.maxPrice ?? 0).toLocaleString()}`],
    };
  }
  return { points: 0, reasons: [`Price mismatch: $${Math.round(value).toLocaleString()} outside $${(buyer.minPrice ?? 0).toLocaleString()}–$${(buyer.maxPrice ?? 0).toLocaleString()}`] };
}

function propertyTypeScore(lead: Lead, buyer: Buyer): { points: number; reasons: string[] } {
  if (!buyer.propertyTypes.length) {
    return { points: 10, reasons: ['Buys any property type'] };
  }
  const type = (lead.propertyType || '').toLowerCase();
  if (buyer.propertyTypes.some((t) => t.toLowerCase() === type)) {
    return { points: 15, reasons: [`Property type match: ${lead.propertyType}`] };
  }
  return { points: 0, reasons: [`Doesn't buy ${lead.propertyType || 'this property type'}`] };
}

function equityScore(lead: Lead, buyer: Buyer): { points: number; reasons: string[] } {
  if (buyer.minEquityPercent === null) {
    return { points: 8, reasons: ['No equity minimum'] };
  }
  const eq = lead.equityPercent;
  if (eq === null || eq === undefined) {
    return { points: 4, reasons: ['Equity unknown'] };
  }
  if (eq >= buyer.minEquityPercent) {
    return { points: 15, reasons: [`Equity ${eq}% ≥ ${buyer.minEquityPercent}% minimum`] };
  }
  return { points: 0, reasons: [`Equity ${eq}% below ${buyer.minEquityPercent}% minimum`] };
}

function financingScore(buyer: Buyer): { points: number; reasons: string[] } {
  if (buyer.financing === 'cash') return { points: 5, reasons: ['Cash buyer — fast close'] };
  if (buyer.financing === 'either') return { points: 3, reasons: ['Cash or financing'] };
  return { points: 1, reasons: ['Financing required'] };
}

function rehabScore(lead: Lead, buyer: Buyer): { points: number; bonus: number; reasons: string[] } {
  const needsRehab = lead.categories.some((c) => ['code_violation', 'vacant', 'foreclosure', 'sheriff_sale'].includes(c));
  const budget = buyer.maxRehabBudget;
  if (needsRehab && budget !== null && budget > 0) {
    const fits = budget >= 50000;
    return {
      points: fits ? 10 : 7,
      bonus: 0,
      reasons: [`Rehab-ready buyer ($${budget.toLocaleString()} budget) for distressed condition`],
    };
  }
  if (needsRehab && (budget === null || budget === 0)) {
    return { points: 3, bonus: 0, reasons: ['Distressed condition — rehab appetite unknown'] };
  }
  if (!needsRehab) {
    return { points: 6, bonus: 0, reasons: ['Property in average+ condition'] };
  }
  return { points: 5, bonus: 0, reasons: [] };
}

/** Rank all active buyers against a lead, best match first. */
export function matchBuyers(lead: Lead, buyers: Buyer[], activeOnly = true): BuyerMatch[] {
  const pool = activeOnly ? buyers.filter((b) => b.active) : buyers;
  const matches: BuyerMatch[] = pool.map((buyer) => {
    const loc = locationScore(lead, buyer);
    const price = priceScore(lead, buyer);
    const type = propertyTypeScore(lead, buyer);
    const equity = equityScore(lead, buyer);
    const fin = financingScore(buyer);
    const rehab = rehabScore(lead, buyer);

    let score = loc.points + price.points + type.points + equity.points + fin.points + rehab.points;
    const reasons = [loc, price, type, equity, fin, rehab].flatMap((r) => r.reasons);

    // Urgency bonus — time-sensitive leads are gold for buyers who can move fast
    if (lead.auctionDate && buyer.financing === 'cash') {
      score += 10;
      reasons.push('Urgency bonus: auction date + cash buyer');
    }

    return { buyer, score: Math.round(score), reasons: reasons.filter(Boolean) };
  });
  return matches.sort((a, b) => b.score - a.score || a.buyer.name.localeCompare(b.buyer.name));
}
