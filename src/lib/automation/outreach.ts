/**
 * Steps 7 & 8 — Outreach engine.
 *
 * Channel adapters send through real providers when configured:
 *   - Email: Sender.net (SENDER_API_TOKEN + SENDER_FROM_EMAIL) when present,
 *            falling back to SendGrid (SENDGRID_API_KEY + SENDGRID_FROM_EMAIL),
 *            then Mailgun (MAILGUN_API_KEY + MAILGUN_DOMAIN + MAILGUN_FROM_EMAIL)
 *   - SMS:   Twilio   (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER)
 *   - Ringless voicemail / direct mail: provider stubs (Slybroadcast / Lob)
 *
 * Without credentials each adapter runs in SIMULATION mode: messages are
 * fully personalized, logged to the communication history with realistic
 * delivery outcomes, and clearly marked `simulated: true`. This keeps the
 * system demoable and legally safe by default (no accidental cold SMS).
 *
 * TCPA / opt-out compliance: every dispatcher (sendOutreach for sellers,
 * notifyBuyer for the investor network) hard-gates on the Do-Not-Contact
 * list BEFORE any provider call. A suppressed contact produces a blocked
 * Communication (`status: "suppressed"`, `provider: "compliance-gate"`)
 * and an audit entry in the consent-events log instead of a send.
 */

import { Buyer, BuyerMatch, Communication, ConsentEvent, Lead, OutreachChannel, SuppressionRecord } from './types';
import { createRng, chance, uid } from './rng';
import { getStore } from './store';

export const CHANNEL_COST: Record<OutreachChannel, number> = {
  email: 0.005,
  sms: 0.02,
  voicemail: 0.06,
  direct_mail: 0.55,
  call_task: 0,
};

export interface SendResult {
  provider: string;
  simulated: boolean;
  status: Communication['status'];
  detail?: string;
}

function simulateDelivery(lead: Lead, channel: OutreachChannel): Communication['status'] {
  const rng = createRng(`${lead.dedupeKey}:${channel}:delivery`);
  if (chance(rng, 0.05)) return 'failed';
  return 'delivered';
}

/* ------------------------- compliance gate -------------------------- */

/**
 * TCPA / opt-out gate — checks phones + emails against the Do-Not-Contact
 * list. Returns the suppression record when the send must be blocked, and
 * writes a `blocked_send` consent event (with lead/buyer context) to the
 * audit log so every enforcement action is accounted for.
 */
export async function complianceGate(opts: {
  phones: string[];
  emails: string[];
  channel: OutreachChannel;
  leadId: string | null;
  buyerId?: string | null;
}): Promise<SuppressionRecord | null> {
  const hit = await getStore().isSuppressed({ phones: opts.phones, emails: opts.emails });
  if (!hit) return null;
  const event: ConsentEvent = {
    id: uid('ce_'),
    leadId: opts.leadId,
    buyerId: opts.buyerId ?? null,
    type: 'blocked_send',
    channel: opts.channel,
    value: hit.value,
    detail: `Blocked ${opts.channel} send — ${hit.value} is on the Do-Not-Contact list (reason: ${hit.reason}, source: ${hit.source})${opts.buyerId ? `; buyer ${opts.buyerId}` : ''}${opts.leadId ? `; lead ${opts.leadId}` : ''}.`,
    createdAt: new Date().toISOString(),
  };
  try {
    await getStore().addConsentEvent(event);
  } catch {
    // Audit logging must never break the gate itself
  }
  return hit;
}

/** Build a blocked Communication (no provider is ever called). */
function blockedCommunication(
  lead: Lead,
  channel: OutreachChannel,
  message: string,
  subject?: string,
): Communication {
  return {
    id: uid('comm_'),
    leadId: lead.id,
    runId: null,
    campaignId: null,
    channel,
    provider: 'compliance-gate',
    simulated: false,
    status: 'suppressed',
    subject,
    message,
    cost: 0,
    sentAt: new Date().toISOString(),
  };
}

/** Deterministic simulated engagement so dashboard funnel metrics are meaningful. */
export function simulateEngagement(lead: Lead, channel: OutreachChannel): {
  replied: boolean;
  interested: boolean;
  appointment: boolean;
} {
  const rng = createRng(`${lead.dedupeKey}:${channel}:engagement`);
  const boost = lead.motivationScore / 400; // higher motivation → more replies
  const replied = chance(rng, 0.06 + boost);
  const interested = replied && chance(rng, 0.45);
  const appointment = interested && chance(rng, 0.4);
  return { replied, interested, appointment };
}

/* ------------------------- channel adapters ------------------------- */

/**
 * Shared email delivery core — used for seller outreach AND buyer deal
 * notifications. Provider chain: Sender.net -> SendGrid -> Mailgun, then
 * deterministic simulation when nothing is configured.
 */
async function deliverEmail(
  to: string,
  toName: string,
  subject: string,
  body: string,
  simSeed: string,
): Promise<SendResult> {
  const senderToken = process.env.SENDER_API_TOKEN;
  const senderFromEmail = process.env.SENDER_FROM_EMAIL;
  const senderFromName = process.env.SENDER_FROM_NAME || 'Hydrascout';
  const sgKey = process.env.SENDGRID_API_KEY;
  const sgFrom = process.env.SENDGRID_FROM_EMAIL;
  const mgKey = process.env.MAILGUN_API_KEY;
  const mgDomain = process.env.MAILGUN_DOMAIN;
  const mgFrom = process.env.MAILGUN_FROM_EMAIL || sgFrom;
  if (!to) return { provider: 'sender.net', simulated: true, status: 'failed', detail: 'No email on file' };

  // Sender.net is the primary transactional email provider when configured.
  if (senderToken && senderFromEmail) {
    const res = await fetch('https://api.sender.net/v2/message/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${senderToken}`,
      },
      body: JSON.stringify({
        from: { email: senderFromEmail, name: senderFromName },
        to: { email: to, name: toName || undefined },
        subject,
        html: body.replace(/\n/g, '<br/>'),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return { provider: 'sender.net', simulated: false, status: 'sent' };
    return { provider: 'sender.net', simulated: false, status: 'failed', detail: `Sender.net ${res.status}` };
  }

  if (sgKey && sgFrom) {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: sgFrom },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 202) return { provider: 'sendgrid', simulated: false, status: 'sent' };
    return { provider: 'sendgrid', simulated: false, status: 'failed', detail: `SendGrid ${res.status}` };
  }

  // Fallback to Mailgun if SendGrid isn't configured
  if (mgKey && mgDomain && mgFrom) {
    const form = new URLSearchParams({ from: mgFrom, to, subject, text: body });
    const res = await fetch(`https://api.mailgun.net/v3/${mgDomain}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`api:${mgKey}`).toString('base64'),
      },
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return { provider: 'mailgun', simulated: false, status: 'sent' };
    return { provider: 'mailgun', simulated: false, status: 'failed', detail: `Mailgun ${res.status}` };
  }

  const rng = createRng(`${simSeed}:email:delivery`);
  return { provider: 'sender.net (simulated)', simulated: true, status: chance(rng, 0.05) ? 'failed' : 'delivered' };
}

async function sendEmail(lead: Lead, subject: string, body: string): Promise<SendResult> {
  return deliverEmail(lead.emails[0]?.address ?? '', lead.ownerName, subject, body, lead.dedupeKey);
}

async function sendSms(lead: Lead, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = lead.phones.find((p) => p.type === 'mobile')?.number || lead.phones[0]?.number;
  if (!to) return { provider: 'twilio', simulated: true, status: 'failed', detail: 'No phone on file' };

  if (sid && token && from) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      },
      body: new URLSearchParams({ To: to.replace(/[^+\d]/g, ''), From: from, Body: body }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return { provider: 'twilio', simulated: false, status: 'sent' };
    return { provider: 'twilio', simulated: false, status: 'failed', detail: `Twilio ${res.status}` };
  }
  return { provider: 'twilio (simulated)', simulated: true, status: simulateDelivery(lead, 'sms') };
}

async function sendVoicemail(lead: Lead): Promise<SendResult> {
  const to = lead.phones[0]?.number;
  if (!to) return { provider: 'rvm', simulated: true, status: 'failed', detail: 'No phone on file' };
  // Stub: integrate Slybroadcast / Drop Cowboy here (SLYBROADCAST_* env vars)
  return { provider: 'slybroadcast (simulated)', simulated: true, status: simulateDelivery(lead, 'voicemail') };
}

async function sendDirectMail(lead: Lead): Promise<SendResult> {
  // Stub: integrate Lob / Click2Mail here (LOB_API_KEY)
  return { provider: 'lob (simulated)', simulated: true, status: simulateDelivery(lead, 'direct_mail') };
}

/* ---------------------------- dispatcher ---------------------------- */

export async function sendOutreach(
  lead: Lead,
  channel: OutreachChannel,
  message: string,
  runId: string,
  campaignId: string,
): Promise<Communication> {
  let result: SendResult;
  let subject: string | undefined;
  let body = message;

  if (channel === 'email') {
    // Allow "Subject: ..." on the first line of the template
    const m = message.match(/^Subject:\s*(.+)\n+([\s\S]*)$/);
    subject = m ? m[1] : `Regarding ${lead.propertyAddress}`;
    body = m ? m[2].trim() : message;
  }

  // TCPA / opt-out gate — check the Do-Not-Contact list BEFORE any dispatch.
  const suppressed = await complianceGate({
    phones: lead.phones.map((p) => p.number),
    emails: lead.emails.map((e) => e.address),
    channel,
    leadId: lead.id,
  });
  if (suppressed) {
    return blockedCommunication(lead, channel, body, subject);
  }

  if (channel === 'email') {
    result = await sendEmail(lead, subject!, body);
  } else if (channel === 'sms') {
    result = await sendSms(lead, body);
  } else if (channel === 'voicemail') {
    result = await sendVoicemail(lead);
  } else if (channel === 'direct_mail') {
    result = await sendDirectMail(lead);
  } else {
    // call_task — creates a task instead of sending anything
    result = { provider: 'internal', simulated: false, status: 'task_created' };
  }

  return {
    id: uid('comm_'),
    leadId: lead.id,
    runId,
    campaignId,
    channel,
    provider: result.provider,
    simulated: result.simulated,
    status: result.status,
    subject,
    message: body,
    cost: result.status === 'failed' ? 0 : CHANNEL_COST[channel],
    sentAt: new Date().toISOString(),
  };
}

/* --------------------- buyer notifications (disposition) ------------ */

function formatBuyerPitch(buyer: Buyer, lead: Lead, match: Pick<BuyerMatch, 'score' | 'reasons'>): {
  subject: string;
  body: string;
} {
  const value = lead.marketValue ?? lead.assessedValue;
  const equity =
    lead.equityPercent !== null && lead.equityPercent !== undefined
      ? `${lead.equityPercent}% (~$${Math.round(lead.equityEstimate ?? 0).toLocaleString()})`
      : 'unknown';
  const subject = `New off-market deal in ${lead.city || lead.county}, ${lead.state} — ${lead.propertyAddress}`;
  const body = [
    `Hi ${buyer.name || 'there'},`,
    ``,
    `A new property just hit our pipeline that fits your buy-box (match score ${match.score}/100):`,
    ``,
    `  Property:  ${lead.propertyAddress}, ${lead.city}, ${lead.state} ${lead.zip}`,
    `  Type:      ${lead.propertyType}`,
    `  Est. value: ${value !== null ? `$${Math.round(value).toLocaleString()}` : 'unknown'}`,
    `  Equity:    ${equity}`,
    `  Flags:     ${lead.categories.join(', ') || 'none'}`,
    `  Motivation score: ${lead.motivationScore}/100${lead.auctionDate ? ` — auction ${lead.auctionDate} (time-sensitive!)` : ''}`,
    ``,
    `Why we matched you:`,
    ...match.reasons.slice(0, 6).map((r) => `  • ${r}`),
    ``,
    `Interested? Reply to this email or call us and we'll connect you with the seller.`,
    ``,
    `— The Hydrascout Disposition Team`,
  ].join('\n');
  return { subject, body };
}

/**
 * Notify a buyer about a matched lead (disposition module). Gates on the
 * Do-Not-Contact list first — covering BOTH the buyer's own contact info
 * and the seller's (we don't shop a property whose owner has opted out).
 */
export async function notifyBuyer(
  buyer: Buyer,
  lead: Lead,
  match: Pick<BuyerMatch, 'score' | 'reasons'>,
): Promise<Communication> {
  const { subject, body } = formatBuyerPitch(buyer, lead, match);

  const suppressed = await complianceGate({
    phones: [...lead.phones.map((p) => p.number), buyer.phone].filter(Boolean),
    emails: [...lead.emails.map((e) => e.address), buyer.email].filter(Boolean),
    channel: 'email',
    leadId: lead.id,
    buyerId: buyer.id,
  });
  if (suppressed) {
    return blockedCommunication(lead, 'email', body, subject);
  }

  const result = await deliverEmail(buyer.email, buyer.name, subject, body, `buyer:${buyer.id}:${lead.id}`);

  return {
    id: uid('comm_'),
    leadId: lead.id,
    runId: null,
    campaignId: null,
    channel: 'email',
    provider: result.provider,
    simulated: result.simulated,
    status: result.status,
    subject,
    message: body,
    cost: result.status === 'failed' ? 0 : CHANNEL_COST.email,
    sentAt: new Date().toISOString(),
  };
}
