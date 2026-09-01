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
  CampaignRecord,
  Communication,
  DashboardStats,
  EnrichmentAudit,
  FollowUp,
  Lead,
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
  getStats(): Promise<DashboardStats>;
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
}

function memoryDB(): MemoryDB {
  const g = globalThis as unknown as { __hydrawireDB?: MemoryDB };
  if (!g.__hydrawireDB) {
    g.__hydrawireDB = { runs: [], leads: [], communications: [], followUps: [], audits: [], campaigns: [] };
  }
  return g.__hydrawireDB;
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
  async getStats() {
    return computeStats(this.db.leads, this.db.communications, this.db.runs);
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

  async getStats() {
    const [leads, comms, runs] = await Promise.all([this.listLeads(), this.listCommunications(), this.listRuns()]);
    return computeStats(leads, comms, runs);
  }
}

/* ----------------------------- factory ------------------------------ */

export function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key) && process.env.HYDRAWIRE_FORCE_DEMO !== 'true';
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
