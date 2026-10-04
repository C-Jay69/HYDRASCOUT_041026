/**
 * Step 11 — Integrations fan-out.
 *
 * Rather than hand-rolling bespoke OAuth clients for every CRM/spreadsheet
 * platform named in the build prompt (Airtable, Google Sheets, Notion,
 * HubSpot, GoHighLevel, Salesforce), Hydrascout exposes a single outbound
 * webhook contract after every completed run. Point any of the env vars
 * below at a Zapier "Catch Hook", Make "Webhooks" module, or an n8n Webhook
 * node, and that automation can fan the payload out to Airtable, Google
 * Sheets, Notion, HubSpot, GoHighLevel, Salesforce, Slack, etc. with zero
 * code changes here. Direct webhook URLs (e.g. a HubSpot or GoHighLevel
 * inbound webhook) work exactly the same way.
 *
 * All sends are best-effort and non-fatal: a misconfigured or unreachable
 * webhook never fails the pipeline, it's just logged.
 */

import { AutomationRun, CampaignRecord, Lead } from './types';

export interface OutboundWebhook {
  name: string;
  url: string;
}

/** Every configured outbound integration endpoint. */
export function configuredOutboundWebhooks(): OutboundWebhook[] {
  const candidates: OutboundWebhook[] = [
    { name: 'Zapier', url: process.env.ZAPIER_WEBHOOK_URL || '' },
    { name: 'Make.com', url: process.env.MAKE_WEBHOOK_URL || '' },
    { name: 'n8n (CRM sync)', url: process.env.N8N_CRM_WEBHOOK_URL || '' },
    { name: 'CRM/Spreadsheet webhook', url: process.env.CRM_WEBHOOK_URL || '' },
  ];
  return candidates.filter((c) => c.url);
}

export interface SyncOutcome {
  name: string;
  ok: boolean;
  detail?: string;
}

/**
 * POST the completed campaign + leads to every configured outbound
 * integration endpoint (Zapier / Make / n8n / direct CRM webhook).
 * Consumers (Airtable, Google Sheets, Notion, HubSpot, GoHighLevel,
 * Salesforce, ...) are wired on the receiving end inside that automation.
 */
export async function syncExternalPlatforms(
  run: AutomationRun,
  campaign: CampaignRecord,
  leads: Lead[],
): Promise<SyncOutcome[]> {
  const webhooks = configuredOutboundWebhooks();
  if (!webhooks.length) return [];

  const payload = {
    event: 'hydrascout.campaign.completed',
    runId: run.id,
    campaign: { id: campaign.id, name: campaign.name, channels: campaign.channels, stats: campaign.stats },
    leads: leads.map((l) => ({
      id: l.id,
      ownerName: l.ownerName,
      propertyAddress: l.propertyAddress,
      city: l.city,
      state: l.state,
      zip: l.zip,
      county: l.county,
      categories: l.categories,
      motivationScore: l.motivationScore,
      equityEstimate: l.equityEstimate,
      emails: l.emails.map((e) => e.address),
      phones: l.phones.map((p) => p.number),
      status: l.status,
    })),
    sentAt: new Date().toISOString(),
  };

  const results = await Promise.allSettled(
    webhooks.map((hook) =>
      fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      }).then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res;
      }),
    ),
  );

  return results.map((r, i) => ({
    name: webhooks[i].name,
    ok: r.status === 'fulfilled',
    detail: r.status === 'rejected' ? (r.reason instanceof Error ? r.reason.message : String(r.reason)) : undefined,
  }));
}
