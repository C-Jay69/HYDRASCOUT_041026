/**
 * HYDRASCOUT Automation Pipeline — shared types.
 * Implements the data model required by the build prompt:
 * "AI Prompt: Design an Automated Distressed Property Lead Generation & Outreach System"
 */

/** Step 2 — Property Classification categories */
export type LeadCategory =
  | 'tax_delinquent'
  | 'tax_lien'
  | 'tax_deed'
  | 'foreclosure'
  | 'pre_foreclosure'
  | 'sheriff_sale'
  | 'probate'
  | 'bankruptcy'
  | 'code_violation'
  | 'vacant'
  | 'absentee_owner'
  | 'high_equity'
  | 'inherited'
  | 'estate_sale'
  | 'utility_delinquent'
  | 'hoa_lien'
  | 'other_motivated';

export const LEAD_CATEGORY_LABELS: Record<LeadCategory, string> = {
  tax_delinquent: 'Tax Delinquent',
  tax_lien: 'Tax Lien',
  tax_deed: 'Tax Deed',
  foreclosure: 'Foreclosure',
  pre_foreclosure: 'Pre-Foreclosure',
  sheriff_sale: 'Sheriff Sale',
  probate: 'Probate',
  bankruptcy: 'Bankruptcy',
  code_violation: 'Code Violations',
  vacant: 'Vacant Property',
  absentee_owner: 'Absentee Owner',
  high_equity: 'High Equity',
  inherited: 'Inherited Property',
  estate_sale: 'Estate Sale',
  utility_delinquent: 'Utility Delinquent',
  hoa_lien: 'HOA Lien',
  other_motivated: 'Other Motivated Seller',
};

/** Step 7 — Outreach channels */
export type OutreachChannel = 'email' | 'sms' | 'voicemail' | 'direct_mail' | 'call_task';

export const CHANNEL_LABELS: Record<OutreachChannel, string> = {
  email: 'Email',
  sms: 'SMS / Text',
  voicemail: 'Ringless Voicemail',
  direct_mail: 'Direct Mail',
  call_task: 'Manual Call Task',
};

/** Configuration the user submits from the Launch wizard (Step 13 UX). */
export interface AutomationConfig {
  state: string;
  counties: string[];
  leadTypes: LeadCategory[];
  channels: OutreachChannel[];
  campaignName?: string;
  /** Optional per-channel template overrides (personalization variables allowed). */
  templates?: Partial<Record<OutreachChannel, string>>;
  /** Only include leads at or above this motivation score in the campaign. */
  minScore?: number;
}

/** A raw record as returned by a data-source connector (Step 1). */
export interface RawRecord {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  county: string;
  state: string;
  ownerName?: string;
  propertyAddress: string;
  city?: string;
  zip?: string;
  mailingAddress?: string;
  apn?: string;
  propertyType?: string;
  assessedValue?: number;
  marketValue?: number;
  loanBalance?: number;
  lienAmount?: number;
  delinquentTaxes?: number;
  auctionDate?: string;
  filingDate?: string;
  lastSaleDate?: string;
  yearsOwned?: number;
  lienCount?: number;
  flags: Partial<Record<LeadCategory, boolean>>;
}

export interface PhoneRecord {
  number: string;
  type: 'mobile' | 'landline';
  confidence: number;
}

export interface EmailRecord {
  address: string;
  confidence: number;
}

/** A cleaned, classified, enriched, scored lead (Steps 2–6). */
export interface Lead {
  id: string;
  dedupeKey: string;
  ownerName: string;
  ownerType: 'owner_occupied' | 'absentee' | 'corporate';
  isInvestor: boolean;
  propertyAddress: string;
  mailingAddress: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  apn: string;
  propertyType: string;
  assessedValue: number | null;
  marketValue: number | null;
  loanBalance: number | null;
  equityEstimate: number | null;
  equityPercent: number | null;
  lienAmount: number | null;
  lienCount: number;
  delinquentTaxes: number | null;
  auctionDate: string | null;
  filingDate: string | null;
  lastSaleDate: string | null;
  yearsOwned: number | null;
  categories: LeadCategory[];
  motivationScore: number;
  phones: PhoneRecord[];
  emails: EmailRecord[];
  enrichmentConfidence: number | null;
  enrichmentSource: string | null;
  aiSummary: string | null;
  recommendedChannel: OutreachChannel | null;
  sources: string[];
  status: 'new' | 'contacted' | 'replied' | 'interested' | 'appointment' | 'converted' | 'dead';
  tags: string[];
  notes: string;
  followUpAt: string | null;
  runId: string;
  createdAt: string;
  updatedAt: string;
}

/** Step 8.8 — communication / delivery log */
export interface Communication {
  id: string;
  leadId: string;
  runId: string | null;
  campaignId: string | null;
  channel: OutreachChannel;
  provider: string;
  simulated: boolean;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'replied' | 'task_created';
  subject?: string;
  message: string;
  cost: number;
  sentAt: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  runId: string | null;
  dueAt: string;
  reason: string;
  channel: OutreachChannel;
  done: boolean;
  createdAt: string;
}

/** Step 4 — enrichment audit log entry */
export interface EnrichmentAudit {
  id: string;
  leadId: string;
  runId: string;
  provider: string;
  matched: boolean;
  confidence: number;
  rejectedReason: string | null;
  fieldsEnriched: string[];
  createdAt: string;
}

export interface CampaignRecord {
  id: string;
  runId: string | null;
  name: string;
  channels: OutreachChannel[];
  status: 'draft' | 'sending' | 'completed' | 'failed';
  leadIds: string[];
  stats: {
    sent: number;
    delivered: number;
    failed: number;
    replies: number;
    interested: number;
    appointments: number;
    cost: number;
  };
  createdAt: string;
  completedAt: string | null;
}

/** Pipeline stage identifiers — mirror Step 8 of the prompt. */
export type StageId =
  | 'collect'
  | 'classify'
  | 'clean'
  | 'enrich'
  | 'score'
  | 'build_lists'
  | 'outreach'
  | 'followups';

export const STAGES: { id: StageId; label: string }[] = [
  { id: 'collect', label: 'Collect property records' },
  { id: 'classify', label: 'Classify distress categories' },
  { id: 'clean', label: 'Clean, normalize & de-duplicate' },
  { id: 'enrich', label: 'Enrich owner contact info' },
  { id: 'score', label: 'Score lead motivation (0-100)' },
  { id: 'build_lists', label: 'Build campaign lists' },
  { id: 'outreach', label: 'Send outreach & log delivery' },
  { id: 'followups', label: 'Schedule follow-ups' },
];

export interface RunLogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error' | 'success';
  stage: StageId | 'system';
  message: string;
}

export interface AutomationRun {
  id: string;
  config: AutomationConfig;
  status: 'queued' | 'running' | 'completed' | 'failed';
  currentStage: StageId | null;
  stagesDone: StageId[];
  logs: RunLogEntry[];
  stats: {
    rawRecords: number;
    sourcesQueried: number;
    afterDedupe: number;
    duplicatesRemoved: number;
    enriched: number;
    enrichmentRejected: number;
    campaignLeads: number;
    outreachSent: number;
    outreachFailed: number;
    followUpsScheduled: number;
    avgScore: number;
    cost: number;
  };
  campaignId: string | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface DashboardStats {
  newLeadsToday: number;
  totalProperties: number;
  foreclosures: number;
  preForeclosures: number;
  taxLiens: number;
  probates: number;
  vacant: number;
  outreachSent: number;
  repliesReceived: number;
  interestedSellers: number;
  appointments: number;
  conversionRate: number;
  costPerLead: number;
  totalCost: number;
  runsCompleted: number;
  byCategory: Record<string, number>;
}
