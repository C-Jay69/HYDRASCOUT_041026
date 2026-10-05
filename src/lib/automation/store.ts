/**
 * Step 6 — CRM persistence layer.
 *
 * Two interchangeable backends:
 *   - SupabaseStore: used automatically when Supabase env vars are set
 *     (schema in /database/schema.sql).
 *   - MemoryStore: zero-config in-memory backend so the app is fully
 *     functional in demo mode (data resets when the server restarts).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AutomationRun,
  Buyer,
  CampaignRecord,
  Communication,
  ConsentEvent,
  DashboardStats,
  Deal,
  EnrichmentAudit,
  FollowUp,
  Lead,
  SuppressionRecord,
} from './types';

export interface LeadFilters {
  search?: string;
  state?: string;
  county?: string;
  city?: string;
  zip?: string;
  category?: string;
  status?: string;
  minScore?: number;
  ownerType?: string;
  limit?: number;
}

export interface UpsertResult {
  inserted: number;
  mergedWithExisting: number;
  leads: Lead[];
}

/** Contact values checked against the Do-Not-Contact list. */
export interface SuppressionCheck {
  phones?: string[];
  emails?: string[];
}

export interface Store {
  readonly backend: 'memory' | 'supabase';
  createRun(run: AutomationRun): Promise<void>;
  updateRun(run: AutomationRun): Promise<void>;
  getRun(id: string): Promise<AutomationRun | null>;
  listRuns(): Promise<AutomationRun[]>;
  /** Cross-run dedupe: merges incoming leads with any existing lead sharing a dedupeKey. */
  upsertLeads(leads: Lead[]): Promise<UpsertResult>;
  saveLead(lead: Lead): Promise<void>;
  getLead(id: string): Promise<Lead | null>;
  updateLead(id: string, patch: Partial<Lead>): Promise<Lead | null>;
  listLeads(filters?: LeadFilters): Promise<Lead[]>;
  addCommunications(comms: Communication[]): Promise<void>;
  listCommunications(leadId?: string): Promise<Communication[]>;
  addFollowUps(followUps: FollowUp[]): Promise<void>;
  listFollowUps(leadId?: string): Promise<FollowUp[]>;
  addAudits(audits: EnrichmentAudit[]): Promise<void>;
  listAudits(runId?: string): Promise<EnrichmentAudit[]>;
  createCampaign(campaign: CampaignRecord): Promise<void>;
  updateCampaign(campaign: CampaignRecord): Promise<void>;
  listCampaigns(): Promise<CampaignRecord[]>;
  /* -------- buyers (disposition module) -------- */
  createBuyer(buyer: Buyer): Promise<void>;
  updateBuyer(buyer: Buyer): Promise<void>;
  deleteBuyer(id: string): Promise<void>;
  getBuyer(id: string): Promise<Buyer | null>;
  listBuyers(activeOnly?: boolean): Promise<Buyer[]>;
  /* -------- deals (disposition module) -------- */
  saveDeal(deal: Deal): Promise<void>;
  getDeal(id: string): Promise<Deal | null>;
  getDealByLead(leadId: string): Promise<Deal | null>;
  listDeals(): Promise<Deal[]>;
  /* -------- compliance (suppression module) -------- */
  addSuppression(record: SuppressionRecord): Promise<SuppressionRecord>;
  removeSuppression(id: string): Promise<boolean>;
  removeSuppressionByValue(value: string): Promise<boolean>;
  listSuppressions(): Promise<SuppressionRecord[]>;
  /** Returns the matching Do-Not-Contact record when any phone/email is suppressed. */
  isSuppressed(contact: SuppressionCheck): Promise<SuppressionRecord | null>;
  /* -------- consent audit log -------- */
  addConsentEvent(event: ConsentEvent): Promise<void>;
  listConsentEvents(limit?: number): Promise<ConsentEvent[]>;
  getStats(): Promise<DashboardStats>;
}

/* ----------------------------- helpers ------------------------------ */

/** Normalize a phone number to 10 significant digits (US) for suppression matching. */
export function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

/** Normalize an email address for suppression matching. */
export function normalizeEmail(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

/** True when two phone strings refer to the same number (tolerant of +1 / formatting). */
export function phonesMatch(a: string, b: string): boolean {
  const x = normalizePhone(a);
  const y = normalizePhone(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return x.length >= 10 && y.length >= 10 && x.slice(-10) === y.slice(-10);
}

/* ----------------------------- helpers ------------------------------ */

function mergeLead(existing: Lead, incoming: Lead): Lead {
  return {
    ...existing,
    categories: [...new Set([...existing.categories, ...incoming.categories])],
    sources: [...new Set([...existing.sources, ...incoming.sources])],
    ownerName: existing.ownerName || incoming.ownerName,
    mailingAddress: existing.mailingAddress || incoming.mailingAddress,
    lienAmount: existing.lienAmount ?? incoming.lienAmount,
    lienCount: Math.max(existing.lienCount, incoming.lienCount),
    delinquentTaxes: existing.delinquentTaxes ?? incoming.delinquentTaxes,
    auctionDate: existing.auctionDate ?? incoming.auctionDate,
    phones: existing.phones.length ? existing.phones : incoming.phones,
    emails: existing.emails.length ? existing.emails : incoming.emails,
    updatedAt: new Date().toISOString(),
  };
}

function applyFilters(leads: Lead[], f: LeadFilters = {}): Lead[] {
  let out = leads;
  if (f.search) {
    const q = f.search.toLowerCase();
    out = out.filter(
      (l) =>
        l.propertyAddress.toLowerCase().includes(q) ||
        l.ownerName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.county.toLowerCase().includes(q) ||
        l.apn.toLowerCase().includes(q),
    );
  }
  if (f.state) out = out.filter((l) => l.state.toLowerCase() === f.state!.toLowerCase());
  if (f.county) out = out.filter((l) => l.county.toLowerCase().includes(f.county!.toLowerCase()));
  if (f.city) out = out.filter((l) => l.city.toLowerCase().includes(f.city!.toLowerCase()));
  if (f.zip) out = out.filter((l) => l.zip.startsWith(f.zip!));
  if (f.category) out = out.filter((l) => l.categories.includes(f.category as never));
  if (f.status) out = out.filter((l) => l.status === f.status);
  if (f.ownerType) out = out.filter((l) => l.ownerType === f.ownerType);
  if (f.minScore) out = out.filter((l) => l.motivationScore >= f.minScore!);
  out = [...out].sort((a, b) => b.motivationScore - a.motivationScore);
  if (f.limit) out = out.slice(0, f.limit);
  return out;
}

function computeStats(
  leads: Lead[],
  comms: Communication[],
  runs: AutomationRun[],
  buyers: Buyer[] = [],
  deals: Deal[] = [],
  suppressions: SuppressionRecord[] = [],
): DashboardStats {
  const today = new Date().toISOString().slice(0, 10);
  const byCategory: Record<string, number> = {};
  for (const l of leads) {
    for (const c of l.categories) byCategory[c] = (byCategory[c] || 0) + 1;
  }
  const sent = comms.filter((c) => c.status !== 'failed');
  const replies = leads.filter((l) => ['replied', 'interested', 'appointment', 'converted'].includes(l.status)).length;
  const interested = leads.filter((l) => ['interested', 'appointment', 'converted'].includes(l.status)).length;
  const appointments = leads.filter((l) => ['appointment', 'converted'].includes(l.status)).length;
  const totalCost = comms.reduce((s, c) => s + c.cost, 0);
  return {
    newLeadsToday: leads.filter((l) => l.createdAt.slice(0, 10) === today).length,
    totalProperties: leads.length,
    foreclosures: byCategory['foreclosure'] || 0,
    preForeclosures: byCategory['pre_foreclosure'] || 0,
    taxLiens: byCategory['tax_lien'] || 0,
    probates: byCategory['probate'] || 0,
    vacant: byCategory['vacant'] || 0,
    outreachSent: sent.length,
    repliesReceived: replies,
    interestedSellers: interested,
    appointments,
    conversionRate: sent.length ? Math.round((interested / Math.max(1, leads.length)) * 1000) / 10 : 0,
    costPerLead: leads.length ? Math.round((totalCost / leads.length) * 100) / 100 : 0,
    totalCost: Math.round(totalCost * 100) / 100,
    runsCompleted: runs.filter((r) => r.status === 'completed').length,
    byCategory,
    activeBuyers: buyers.filter((b) => b.active).length,
    dealsPitched: deals.filter((d) => d.status === 'pitched').length,
    dealsAssigned: deals.filter((d) => d.status === 'assigned').length,
    dealsClosed: deals.filter((d) => d.status === 'closed').length,
    suppressedContacts: suppressions.length,
  };
}

/* ---------------------------- MemoryStore --------------------------- */

interface MemoryDB {
  runs: AutomationRun[];
  leads: Lead[];
  communications: Communication[];
  followUps: FollowUp[];
  audits: EnrichmentAudit[];
  campaigns: CampaignRecord[];
  buyers: Buyer[];
  deals: Deal[];
  suppressions: SuppressionRecord[];
  consentEvents: ConsentEvent[];
}

function memoryDB(): MemoryDB {
  const g = globalThis as unknown as { __hydrascoutDB?: MemoryDB };
  if (!g.__hydrascoutDB) {
    g.__hydrascoutDB = {
      runs: [], leads: [], communications: [], followUps: [], audits: [], campaigns: [],
      buyers: [], deals: [], suppressions: [], consentEvents: [],
    };
  }
  return g.__hydrascoutDB;
}

class MemoryStore implements Store {
  readonly backend = 'memory' as const;
  private db = memoryDB();

  async createRun(run: AutomationRun) {
    this.db.runs.unshift(run);
  }
  async updateRun(run: AutomationRun) {
    const i = this.db.runs.findIndex((r) => r.id === run.id);
    if (i >= 0) this.db.runs[i] = run;
  }
  async getRun(id: string) {
    return this.db.runs.find((r) => r.id === id) ?? null;
  }
  async listRuns() {
    return [...this.db.runs];
  }

  async upsertLeads(leads: Lead[]): Promise<UpsertResult> {
    let inserted = 0;
    let merged = 0;
    const out: Lead[] = [];
    for (const lead of leads) {
      const existing = this.db.leads.find((l) => l.dedupeKey === lead.dedupeKey);
      if (existing) {
        const m = mergeLead(existing, lead);
        const i = this.db.leads.findIndex((l) => l.id === existing.id);
        this.db.leads[i] = m;
        out.push(m);
        merged++;
      } else {
        this.db.leads.push(lead);
        out.push(lead);
        inserted++;
      }
    }
    return { inserted, mergedWithExisting: merged, leads: out };
  }

  async saveLead(lead: Lead) {
    const i = this.db.leads.findIndex((l) => l.id === lead.id);
    if (i >= 0) this.db.leads[i] = lead;
    else this.db.leads.push(lead);
  }
  async getLead(id: string) {
    return this.db.leads.find((l) => l.id === id) ?? null;
  }
  async updateLead(id: string, patch: Partial<Lead>) {
    const i = this.db.leads.findIndex((l) => l.id === id);
    if (i < 0) return null;
    this.db.leads[i] = { ...this.db.leads[i], ...patch, updatedAt: new Date().toISOString() };
    return this.db.leads[i];
  }
  async listLeads(filters?: LeadFilters) {
    return applyFilters(this.db.leads, filters);
  }

  async addCommunications(comms: Communication[]) {
    this.db.communications.push(...comms);
  }
  async listCommunications(leadId?: string) {
    return leadId ? this.db.communications.filter((c) => c.leadId === leadId) : [...this.db.communications];
  }
  async addFollowUps(followUps: FollowUp[]) {
    this.db.followUps.push(...followUps);
  }
  async listFollowUps(leadId?: string) {
    return leadId ? this.db.followUps.filter((f) => f.leadId === leadId) : [...this.db.followUps];
  }
  async addAudits(audits: EnrichmentAudit[]) {
    this.db.audits.push(...audits);
  }
  async listAudits(runId?: string) {
    return runId ? this.db.audits.filter((a) => a.runId === runId) : [...this.db.audits];
  }
  async createCampaign(campaign: CampaignRecord) {
    this.db.campaigns.unshift(campaign);
  }
  async updateCampaign(campaign: CampaignRecord) {
    const i = this.db.campaigns.findIndex((c) => c.id === campaign.id);
    if (i >= 0) this.db.campaigns[i] = campaign;
  }
  async listCampaigns() {
    return [...this.db.campaigns];
  }

  /* -------- buyers -------- */
  async createBuyer(buyer: Buyer) {
    this.db.buyers.unshift(buyer);
  }
  async updateBuyer(buyer: Buyer) {
    const i = this.db.buyers.findIndex((b) => b.id === buyer.id);
    if (i >= 0) this.db.buyers[i] = buyer;
  }
  async deleteBuyer(id: string) {
    this.db.buyers = this.db.buyers.filter((b) => b.id !== id);
  }
  async getBuyer(id: string) {
    return this.db.buyers.find((b) => b.id === id) ?? null;
  }
  async listBuyers(activeOnly?: boolean) {
    const out = activeOnly ? this.db.buyers.filter((b) => b.active) : [...this.db.buyers];
    return out.sort((a, b) => b.dealsClosed - a.dealsClosed || a.name.localeCompare(b.name));
  }

  /* -------- deals -------- */
  async saveDeal(deal: Deal) {
    const i = this.db.deals.findIndex((d) => d.id === deal.id);
    if (i >= 0) this.db.deals[i] = deal;
    else this.db.deals.unshift(deal);
  }
  async getDeal(id: string) {
    return this.db.deals.find((d) => d.id === id) ?? null;
  }
  async getDealByLead(leadId: string) {
    return this.db.deals.find((d) => d.leadId === leadId) ?? null;
  }
  async listDeals() {
    return [...this.db.deals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  /* -------- suppression list -------- */
  async addSuppression(record: SuppressionRecord): Promise<SuppressionRecord> {
    const value = record.type === 'phone' ? normalizePhone(record.value) : normalizeEmail(record.value);
    const existing = this.db.suppressions.find((s) => s.value === value && s.type === record.type);
    if (existing) return existing;
    const rec: SuppressionRecord = { ...record, value };
    this.db.suppressions.unshift(rec);
    return rec;
  }
  async removeSuppression(id: string) {
    const before = this.db.suppressions.length;
    this.db.suppressions = this.db.suppressions.filter((s) => s.id !== id);
    return this.db.suppressions.length < before;
  }
  async removeSuppressionByValue(value: string) {
    const phone = normalizePhone(value);
    const email = normalizeEmail(value);
    const before = this.db.suppressions.length;
    this.db.suppressions = this.db.suppressions.filter(
      (s) => !((s.type === 'phone' && phone && s.value === phone) || (s.type === 'email' && email && s.value === email)),
    );
    return this.db.suppressions.length < before;
  }
  async listSuppressions() {
    return [...this.db.suppressions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async isSuppressed(contact: SuppressionCheck): Promise<SuppressionRecord | null> {
    const phones = (contact.phones || []).map(normalizePhone).filter(Boolean);
    const emails = (contact.emails || []).map(normalizeEmail).filter(Boolean);
    for (const rec of this.db.suppressions) {
      if (rec.type === 'phone' && phones.some((p) => phonesMatch(p, rec.value))) return rec;
      if (rec.type === 'email' && emails.includes(rec.value)) return rec;
    }
    return null;
  }

  /* -------- consent audit log -------- */
  async addConsentEvent(event: ConsentEvent) {
    this.db.consentEvents.unshift(event);
  }
  async listConsentEvents(limit?: number) {
    const out = [...this.db.consentEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return limit ? out.slice(0, limit) : out;
  }

  async getStats() {
    return computeStats(
      this.db.leads,
      this.db.communications,
      this.db.runs,
      this.db.buyers,
      this.db.deals,
      this.db.suppressions,
    );
  }
}

/* --------------------------- SupabaseStore -------------------------- */

function rowToLead(row: Record<string, unknown>): Lead {
  return row.data as Lead;
}

class SupabaseStore implements Store {
  readonly backend = 'supabase' as const;
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  private leadRow(lead: Lead) {
    return {
      id: lead.id,
      dedupe_key: lead.dedupeKey,
      run_id: lead.runId,
      state: lead.state,
      county: lead.county,
      city: lead.city,
      zip: lead.zip,
      status: lead.status,
      categories: lead.categories,
      motivation_score: lead.motivationScore,
      created_at: lead.createdAt,
      updated_at: lead.updatedAt,
      data: lead,
    };
  }

  async createRun(run: AutomationRun) {
    await this.client.from('automation_runs').insert({ id: run.id, data: run, status: run.status, started_at: run.startedAt });
  }
  async updateRun(run: AutomationRun) {
    await this.client.from('automation_runs').update({ data: run, status: run.status, finished_at: run.finishedAt }).eq('id', run.id);
  }
  async getRun(id: string) {
    const { data } = await this.client.from('automation_runs').select('data').eq('id', id).maybeSingle();
    return (data?.data as AutomationRun) ?? null;
  }
  async listRuns() {
    const { data } = await this.client.from('automation_runs').select('data').order('started_at', { ascending: false }).limit(100);
    return (data ?? []).map((r) => r.data as AutomationRun);
  }

  async upsertLeads(leads: Lead[]): Promise<UpsertResult> {
    const keys = leads.map((l) => l.dedupeKey);
    const { data: existingRows } = await this.client.from('leads').select('data').in('dedupe_key', keys);
    const existingByKey = new Map<string, Lead>((existingRows ?? []).map((r) => {
      const l = rowToLead(r);
      return [l.dedupeKey, l];
    }));

    let inserted = 0;
    let merged = 0;
    const out: Lead[] = [];
    const rows: ReturnType<SupabaseStore['leadRow']>[] = [];
    for (const lead of leads) {
      const existing = existingByKey.get(lead.dedupeKey);
      if (existing) {
        const m = mergeLead(existing, lead);
        rows.push(this.leadRow(m));
        out.push(m);
        merged++;
      } else {
        rows.push(this.leadRow(lead));
        out.push(lead);
        inserted++;
      }
    }
    if (rows.length) {
      const { error } = await this.client.from('leads').upsert(rows, { onConflict: 'dedupe_key' });
      if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    }
    return { inserted, mergedWithExisting: merged, leads: out };
  }

  async saveLead(lead: Lead) {
    await this.client.from('leads').upsert(this.leadRow(lead), { onConflict: 'dedupe_key' });
  }
  async getLead(id: string) {
    const { data } = await this.client.from('leads').select('data').eq('id', id).maybeSingle();
    return data ? rowToLead(data) : null;
  }
  async updateLead(id: string, patch: Partial<Lead>) {
    const lead = await this.getLead(id);
    if (!lead) return null;
    const updated = { ...lead, ...patch, updatedAt: new Date().toISOString() };
    await this.client.from('leads').update(this.leadRow(updated)).eq('id', id);
    return updated;
  }
  async listLeads(filters?: LeadFilters) {
    // Pull a working set and filter in app code (keeps parity with MemoryStore)
    const { data } = await this.client
      .from('leads')
      .select('data')
      .order('motivation_score', { ascending: false })
      .limit(2000);
    return applyFilters((data ?? []).map(rowToLead), filters);
  }

  async addCommunications(comms: Communication[]) {
    if (!comms.length) return;
    await this.client.from('communications').insert(
      comms.map((c) => ({
        id: c.id, lead_id: c.leadId, run_id: c.runId, campaign_id: c.campaignId, channel: c.channel,
        provider: c.provider, simulated: c.simulated, status: c.status, subject: c.subject ?? null,
        message: c.message, cost: c.cost, sent_at: c.sentAt,
      })),
    );
  }
  async listCommunications(leadId?: string) {
    let q = this.client.from('communications').select('*').order('sent_at', { ascending: false }).limit(5000);
    if (leadId) q = q.eq('lead_id', leadId);
    const { data } = await q;
    return (data ?? []).map((r) => ({
      id: r.id, leadId: r.lead_id, runId: r.run_id, campaignId: r.campaign_id, channel: r.channel,
      provider: r.provider, simulated: r.simulated, status: r.status, subject: r.subject ?? undefined,
      message: r.message, cost: Number(r.cost), sentAt: r.sent_at,
    })) as Communication[];
  }

  async addFollowUps(followUps: FollowUp[]) {
    if (!followUps.length) return;
    await this.client.from('follow_ups').insert(
      followUps.map((f) => ({
        id: f.id, lead_id: f.leadId, run_id: f.runId, due_at: f.dueAt, reason: f.reason,
        channel: f.channel, done: f.done, created_at: f.createdAt,
      })),
    );
  }
  async listFollowUps(leadId?: string) {
    let q = this.client.from('follow_ups').select('*').order('due_at').limit(2000);
    if (leadId) q = q.eq('lead_id', leadId);
    const { data } = await q;
    return (data ?? []).map((r) => ({
      id: r.id, leadId: r.lead_id, runId: r.run_id, dueAt: r.due_at, reason: r.reason,
      channel: r.channel, done: r.done, createdAt: r.created_at,
    })) as FollowUp[];
  }

  async addAudits(audits: EnrichmentAudit[]) {
    if (!audits.length) return;
    await this.client.from('enrichment_audits').insert(
      audits.map((a) => ({
        id: a.id, lead_id: a.leadId, run_id: a.runId, provider: a.provider, matched: a.matched,
        confidence: a.confidence, rejected_reason: a.rejectedReason, fields_enriched: a.fieldsEnriched,
        created_at: a.createdAt,
      })),
    );
  }
  async listAudits(runId?: string) {
    let q = this.client.from('enrichment_audits').select('*').order('created_at', { ascending: false }).limit(5000);
    if (runId) q = q.eq('run_id', runId);
    const { data } = await q;
    return (data ?? []).map((r) => ({
      id: r.id, leadId: r.lead_id, runId: r.run_id, provider: r.provider, matched: r.matched,
      confidence: Number(r.confidence), rejectedReason: r.rejected_reason, fieldsEnriched: r.fields_enriched ?? [],
      createdAt: r.created_at,
    })) as EnrichmentAudit[];
  }

  async createCampaign(campaign: CampaignRecord) {
    await this.client.from('outreach_campaigns').insert({ id: campaign.id, data: campaign, created_at: campaign.createdAt });
  }
  async updateCampaign(campaign: CampaignRecord) {
    await this.client.from('outreach_campaigns').update({ data: campaign }).eq('id', campaign.id);
  }
  async listCampaigns() {
    const { data } = await this.client.from('outreach_campaigns').select('data').order('created_at', { ascending: false }).limit(200);
    return (data ?? []).map((r) => r.data as CampaignRecord);
  }

  /* -------- buyers -------- */
  private buyerRow(buyer: Buyer) {
    return {
      id: buyer.id,
      active: buyer.active,
      deals_closed: buyer.dealsClosed,
      data: buyer,
      created_at: buyer.createdAt,
      updated_at: buyer.updatedAt,
    };
  }

  async createBuyer(buyer: Buyer) {
    await this.client.from('buyers').insert(this.buyerRow(buyer));
  }
  async updateBuyer(buyer: Buyer) {
    await this.client.from('buyers').update(this.buyerRow(buyer)).eq('id', buyer.id);
  }
  async deleteBuyer(id: string) {
    await this.client.from('buyers').delete().eq('id', id);
  }
  async getBuyer(id: string) {
    const { data } = await this.client.from('buyers').select('data').eq('id', id).maybeSingle();
    return (data?.data as Buyer) ?? null;
  }
  async listBuyers(activeOnly?: boolean) {
    const { data } = await this.client.from('buyers').select('data').order('created_at', { ascending: false }).limit(1000);
    const buyers = ((data ?? []) as { data: Buyer }[]).map((r) => r.data);
    const out = activeOnly ? buyers.filter((b) => b.active) : buyers;
    return out.sort((a, b) => b.dealsClosed - a.dealsClosed || a.name.localeCompare(b.name));
  }

  /* -------- deals -------- */
  private dealRow(deal: Deal) {
    return {
      id: deal.id,
      lead_id: deal.leadId,
      buyer_id: deal.buyerId,
      status: deal.status,
      data: deal,
      created_at: deal.createdAt,
      updated_at: deal.updatedAt,
    };
  }

  async saveDeal(deal: Deal) {
    await this.client.from('deals').upsert(this.dealRow(deal), { onConflict: 'id' });
  }
  async getDeal(id: string) {
    const { data } = await this.client.from('deals').select('data').eq('id', id).maybeSingle();
    return (data?.data as Deal) ?? null;
  }
  async getDealByLead(leadId: string) {
    const { data } = await this.client.from('deals').select('data').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1);
    return ((data ?? []) as { data: Deal }[])[0]?.data ?? null;
  }
  async listDeals() {
    const { data } = await this.client.from('deals').select('data').order('updated_at', { ascending: false }).limit(2000);
    return ((data ?? []) as { data: Deal }[]).map((r) => r.data);
  }

  /* -------- suppression list -------- */
  private suppressionRow(rec: SuppressionRecord) {
    return {
      id: rec.id,
      value: rec.type === 'phone' ? normalizePhone(rec.value) : normalizeEmail(rec.value),
      type: rec.type,
      reason: rec.reason,
      source: rec.source,
      lead_id: rec.leadId,
      note: rec.note,
      created_at: rec.createdAt,
    };
  }

  async addSuppression(record: SuppressionRecord): Promise<SuppressionRecord> {
    const row = this.suppressionRow(record);
    const { data, error } = await this.client
      .from('suppressions')
      .upsert(row, { onConflict: 'value' })
      .select('id, value, type, reason, source, lead_id, note, created_at')
      .maybeSingle();
    if (error) throw new Error(`Supabase suppression upsert failed: ${error.message}`);
    if (data) {
      return {
        id: data.id, value: data.value, type: data.type, reason: data.reason ?? '', source: data.source ?? '',
        leadId: data.lead_id ?? null, note: data.note ?? '', createdAt: data.created_at,
      };
    }
    return { ...record, value: row.value };
  }
  async removeSuppression(id: string) {
    const { data } = await this.client.from('suppressions').delete().eq('id', id).select('id');
    return (data ?? []).length > 0;
  }
  async removeSuppressionByValue(value: string) {
    const { data } = await this.client.from('suppressions').delete().eq('value', value).select('id');
    return (data ?? []).length > 0;
  }
  async listSuppressions() {
    const { data } = await this.client.from('suppressions').select('*').order('created_at', { ascending: false }).limit(5000);
    return (data ?? []).map((r) => ({
      id: r.id, value: r.value, type: r.type as 'phone' | 'email', reason: r.reason ?? '',
      source: r.source ?? '', leadId: r.lead_id ?? null, note: r.note ?? '', createdAt: r.created_at,
    })) as SuppressionRecord[];
  }
  async isSuppressed(contact: SuppressionCheck): Promise<SuppressionRecord | null> {
    const phones = (contact.phones || []).map(normalizePhone).filter(Boolean);
    const emails = (contact.emails || []).map(normalizeEmail).filter(Boolean);
    if (!phones.length && !emails.length) return null;
    const { data } = await this.client.from('suppressions').select('*').limit(5000);
    for (const r of data ?? []) {
      if (r.type === 'phone' && phones.some((p) => phonesMatch(p, r.value))) {
        return { id: r.id, value: r.value, type: 'phone', reason: r.reason ?? '', source: r.source ?? '', leadId: r.lead_id ?? null, note: r.note ?? '', createdAt: r.created_at };
      }
      if (r.type === 'email' && emails.includes(r.value)) {
        return { id: r.id, value: r.value, type: 'email', reason: r.reason ?? '', source: r.source ?? '', leadId: r.lead_id ?? null, note: r.note ?? '', createdAt: r.created_at };
      }
    }
    return null;
  }

  /* -------- consent audit log -------- */
  async addConsentEvent(event: ConsentEvent) {
    await this.client.from('consent_events').insert({
      id: event.id, lead_id: event.leadId, buyer_id: event.buyerId, type: event.type,
      channel: event.channel, value: event.value, detail: event.detail, created_at: event.createdAt,
    });
  }
  async listConsentEvents(limit?: number) {
    const { data } = await this.client
      .from('consent_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit ?? 500);
    return (data ?? []).map((r) => ({
      id: r.id, leadId: r.lead_id ?? null, buyerId: r.buyer_id ?? null, type: r.type,
      channel: r.channel ?? 'system', value: r.value ?? null, detail: r.detail ?? '', createdAt: r.created_at,
    })) as ConsentEvent[];
  }

  async getStats() {
    const [leads, comms, runs, buyers, deals, suppressions] = await Promise.all([
      this.listLeads(),
      this.listCommunications(),
      this.listRuns(),
      this.listBuyers(),
      this.listDeals(),
      this.listSuppressions(),
    ]);
    return computeStats(leads, comms, runs, buyers, deals, suppressions);
  }
}

/* ----------------------------- factory ------------------------------ */

export function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key) && process.env.HYDRASCOUT_FORCE_DEMO !== 'true';
}

let supabaseStore: SupabaseStore | null = null;

export function getStore(): Store {
  if (supabaseConfigured()) {
    if (!supabaseStore) {
      const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL)!;
      const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATABASE_SERVICE_ROLE_KEY)!;
      supabaseStore = new SupabaseStore(url, key);
    }
    return supabaseStore;
  }
  return new MemoryStore();
}
