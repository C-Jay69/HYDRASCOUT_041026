/**
 * Steps 2 & 3 — Property Classification + Data Cleaning / De-duplication.
 */

import { Lead, LeadCategory, RawRecord } from './types';
import { uid } from './rng';

/* ---------------------- Step 3: normalization ---------------------- */

const SUFFIX_MAP: Record<string, string> = {
  street: 'St', st: 'St', avenue: 'Ave', ave: 'Ave', av: 'Ave', drive: 'Dr', dr: 'Dr',
  lane: 'Ln', ln: 'Ln', road: 'Rd', rd: 'Rd', court: 'Ct', ct: 'Ct', boulevard: 'Blvd',
  blvd: 'Blvd', way: 'Way', place: 'Pl', pl: 'Pl', terrace: 'Ter', ter: 'Ter',
  circle: 'Cir', cir: 'Cir', parkway: 'Pkwy', pkwy: 'Pkwy', highway: 'Hwy', hwy: 'Hwy',
};

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Llc|Llp|Inc|Ii|Iii|Iv)\b/g, (m) => m.toUpperCase());
}

export function normalizeAddress(addr: string): string {
  const cleaned = addr.replace(/\s+/g, ' ').trim();
  return cleaned
    .split(' ')
    .map((word) => {
      const bare = word.replace(/[.,]/g, '').toLowerCase();
      if (SUFFIX_MAP[bare]) return SUFFIX_MAP[bare] + (word.endsWith(',') ? ',' : '');
      if (/^\d/.test(word)) return word;
      if (/^[A-Z]{2},?$/.test(word)) return word; // state code
      return titleCase(word);
    })
    .join(' ');
}

export function normalizeZip(zip?: string): string {
  if (!zip) return '';
  const m = zip.match(/\d{5}/);
  return m ? m[0] : '';
}

export function dedupeKeyFor(rec: { apn?: string; propertyAddress: string; zip?: string; county: string }): string {
  if (rec.apn) return `apn:${rec.county.toLowerCase()}:${rec.apn.replace(/[^0-9a-z]/gi, '')}`;
  const addr = rec.propertyAddress.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `addr:${addr}:${normalizeZip(rec.zip)}`;
}

/* ---------------------- Step 2: classification --------------------- */

export function classifyRecord(rec: RawRecord): LeadCategory[] {
  const cats = new Set<LeadCategory>();
  for (const [cat, on] of Object.entries(rec.flags)) {
    if (on) cats.add(cat as LeadCategory);
  }

  // Derived signals
  const equity = computeEquity(rec);
  if (equity.percent !== null && equity.percent >= 50) cats.add('high_equity');
  if (rec.mailingAddress && normalizeAddress(rec.mailingAddress) !== normalizeAddress(rec.propertyAddress)) {
    cats.add('absentee_owner');
  }
  if ((rec.delinquentTaxes ?? 0) > 0) cats.add('tax_delinquent');
  if (cats.size === 0) cats.add('other_motivated');
  return [...cats];
}

export function computeEquity(rec: { marketValue?: number; assessedValue?: number; loanBalance?: number }): {
  amount: number | null;
  percent: number | null;
} {
  const value = rec.marketValue ?? rec.assessedValue ?? null;
  if (value === null) return { amount: null, percent: null };
  const loan = rec.loanBalance ?? 0;
  const amount = Math.max(0, value - loan);
  return { amount, percent: Math.round((amount / value) * 100) };
}

/* ------------------- Step 3: build clean leads ---------------------- */

export interface CleanResult {
  leads: Lead[];
  duplicatesRemoved: number;
}

/**
 * Converts raw records into normalized leads and merges duplicates
 * (same APN or same normalized address+ZIP). Data from multiple
 * sources is merged so each property keeps every category and source.
 */
export function cleanAndDedupe(records: RawRecord[], runId: string): CleanResult {
  const map = new Map<string, Lead>();
  let duplicatesRemoved = 0;
  const now = new Date().toISOString();

  for (const rec of records) {
    const key = dedupeKeyFor(rec);
    const categories = classifyRecord(rec);
    const equity = computeEquity(rec);
    const corporate = /\b(llc|llp|inc|trust|corp|holdings|properties|estates)\b/i.test(rec.ownerName || '');
    const absentee = categories.includes('absentee_owner');

    const existing = map.get(key);
    if (existing) {
      duplicatesRemoved++;
      // merge categories & sources; prefer filled-in fields
      existing.categories = [...new Set([...existing.categories, ...categories])];
      if (!existing.sources.includes(rec.sourceName)) existing.sources.push(rec.sourceName);
      existing.ownerName = existing.ownerName || titleCase(rec.ownerName || '');
      existing.mailingAddress = existing.mailingAddress || normalizeAddress(rec.mailingAddress || '');
      existing.lienAmount = existing.lienAmount ?? rec.lienAmount ?? null;
      existing.delinquentTaxes = existing.delinquentTaxes ?? rec.delinquentTaxes ?? null;
      existing.auctionDate = existing.auctionDate ?? rec.auctionDate ?? null;
      existing.lienCount = Math.max(existing.lienCount, rec.lienCount ?? 0);
      continue;
    }

    map.set(key, {
      id: uid('lead_'),
      dedupeKey: key,
      ownerName: rec.ownerName ? titleCase(rec.ownerName) : '',
      ownerType: corporate ? 'corporate' : absentee ? 'absentee' : 'owner_occupied',
      isInvestor: corporate,
      propertyAddress: normalizeAddress(rec.propertyAddress),
      mailingAddress: rec.mailingAddress ? normalizeAddress(rec.mailingAddress) : normalizeAddress(rec.propertyAddress),
      city: rec.city ? titleCase(rec.city) : '',
      county: titleCase(rec.county),
      state: rec.state,
      zip: normalizeZip(rec.zip),
      apn: rec.apn || '',
      propertyType: rec.propertyType || 'Unknown',
      assessedValue: rec.assessedValue ?? null,
      marketValue: rec.marketValue ?? null,
      loanBalance: rec.loanBalance ?? null,
      equityEstimate: equity.amount,
      equityPercent: equity.percent,
      lienAmount: rec.lienAmount ?? null,
      lienCount: rec.lienCount ?? 0,
      delinquentTaxes: rec.delinquentTaxes ?? null,
      auctionDate: rec.auctionDate ?? null,
      filingDate: rec.filingDate ?? null,
      lastSaleDate: rec.lastSaleDate ?? null,
      yearsOwned: rec.yearsOwned ?? null,
      categories,
      motivationScore: 0,
      phones: [],
      emails: [],
      enrichmentConfidence: null,
      enrichmentSource: null,
      aiSummary: null,
      recommendedChannel: null,
      sources: [rec.sourceName],
      status: 'new',
      tags: [],
      notes: '',
      followUpAt: null,
      runId,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { leads: [...map.values()], duplicatesRemoved };
}
