/**
 * Step 4 — Contact Enrichment (skip tracing).
 *
 * Pluggable provider interface. Ships with a deterministic demo provider so
 * the pipeline works without credentials. Add a real provider (BatchData,
 * IDI/LexisNexis, Skip Genie, TLOxp, etc.) by implementing
 * `EnrichmentProvider` and setting the relevant env vars.
 *
 * Every attempt is written to the enrichment audit log; matches below the
 * confidence threshold are rejected per the build prompt.
 */

import { EnrichmentAudit, Lead, PhoneRecord, EmailRecord } from './types';
import { createRng, pick, randInt, chance } from './rng';
import { uid } from './rng';

export const CONFIDENCE_THRESHOLD = 60;

export interface EnrichmentResult {
  matched: boolean;
  confidence: number;
  phones: PhoneRecord[];
  emails: EmailRecord[];
  ownerName?: string;
  mailingAddress?: string;
  provider: string;
}

export interface EnrichmentProvider {
  name: string;
  enrich(lead: Lead): Promise<EnrichmentResult>;
}

/* --------------------- Demo skip-trace provider --------------------- */

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'aol.com', 'icloud.com'];
const FIRST = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda'];
const LAST = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

export const demoSkipTraceProvider: EnrichmentProvider = {
  name: 'HYDRASCOUT Demo Skip Trace',
  async enrich(lead: Lead): Promise<EnrichmentResult> {
    // Deterministic per lead so re-runs are stable
    const rng = createRng(lead.dedupeKey);
    await new Promise((r) => setTimeout(r, 5)); // simulate API latency

    const matched = chance(rng, 0.86);
    const confidence = matched ? randInt(rng, 45, 98) : randInt(rng, 5, 40);

    if (!matched) {
      return { matched: false, confidence, phones: [], emails: [], provider: this.name };
    }

    const ownerName = lead.ownerName || `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
    const [first, last] = ownerName.split(' ');
    const area = randInt(rng, 201, 989);

    const phones: PhoneRecord[] = [];
    const phoneCount = randInt(rng, 1, 3);
    for (let i = 0; i < phoneCount; i++) {
      phones.push({
        number: `(${area}) 555-${String(randInt(rng, 100, 9999)).padStart(4, '0')}`,
        type: chance(rng, 0.65) ? 'mobile' : 'landline',
        confidence: randInt(rng, 40, 98),
      });
    }

    const emails: EmailRecord[] = [];
    if (chance(rng, 0.7)) {
      emails.push({
        address: `${(first || 'owner').toLowerCase()}.${(last || 'seller').toLowerCase()}${randInt(rng, 1, 99)}@${pick(rng, EMAIL_DOMAINS)}`,
        confidence: randInt(rng, 45, 95),
      });
    }

    return { matched: true, confidence, phones, emails, ownerName, provider: this.name };
  },
};

/** Choose active provider. Extend here when wiring a real skip-trace API. */
export function getEnrichmentProvider(): EnrichmentProvider {
  // e.g. if (process.env.BATCHDATA_API_KEY) return batchDataProvider;
  return demoSkipTraceProvider;
}

export interface EnrichOutcome {
  lead: Lead;
  audit: EnrichmentAudit;
  accepted: boolean;
}

/** Enrich one lead, applying the confidence threshold + audit trail. */
export async function enrichLead(lead: Lead, runId: string): Promise<EnrichOutcome> {
  const provider = getEnrichmentProvider();
  const result = await provider.enrich(lead);
  const accepted = result.matched && result.confidence >= CONFIDENCE_THRESHOLD;
  const fieldsEnriched: string[] = [];

  if (accepted) {
    // Keep only individually confident contact points
    const phones = result.phones.filter((p) => p.confidence >= 50);
    const emails = result.emails.filter((e) => e.confidence >= 50);
    if (phones.length) fieldsEnriched.push('phones');
    if (emails.length) fieldsEnriched.push('emails');
    if (!lead.ownerName && result.ownerName) {
      lead.ownerName = result.ownerName;
      fieldsEnriched.push('owner_name');
    }
    lead.phones = phones;
    lead.emails = emails;
    lead.enrichmentConfidence = result.confidence;
    lead.enrichmentSource = result.provider;
  }

  const audit: EnrichmentAudit = {
    id: uid('aud_'),
    leadId: lead.id,
    runId,
    provider: result.provider,
    matched: result.matched,
    confidence: result.confidence,
    rejectedReason: accepted
      ? null
      : result.matched
        ? `Confidence ${result.confidence} below threshold ${CONFIDENCE_THRESHOLD}`
        : 'No match found',
    fieldsEnriched,
    createdAt: new Date().toISOString(),
  };

  return { lead, audit, accepted };
}
