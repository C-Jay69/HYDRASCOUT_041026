/**
 * Steps 7 & 8 — Outreach engine.
 *
 * Channel adapters send through real providers when configured:
 *   - Email: SendGrid (SENDGRID_API_KEY + SENDGRID_FROM_EMAIL)
 *   - SMS:   Twilio   (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER)
 *   - Ringless voicemail / direct mail: provider stubs (Slybroadcast / Lob)
 *
 * Without credentials each adapter runs in SIMULATION mode: messages are
 * fully personalized, logged to the communication history with realistic
 * delivery outcomes, and clearly marked `simulated: true`. This keeps the
 * system demoable and legally safe by default (no accidental cold SMS).
 */

import { Communication, Lead, OutreachChannel } from './types';
import { createRng, chance, uid } from './rng';

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

async function sendEmail(lead: Lead, subject: string, body: string): Promise<SendResult> {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  const to = lead.emails[0]?.address;
  if (!to) return { provider: 'sendgrid', simulated: true, status: 'failed', detail: 'No email on file' };

  if (key && from) {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 202) return { provider: 'sendgrid', simulated: false, status: 'sent' };
    return { provider: 'sendgrid', simulated: false, status: 'failed', detail: `SendGrid ${res.status}` };
  }
  return { provider: 'sendgrid (simulated)', simulated: true, status: simulateDelivery(lead, 'email') };
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
    result = await sendEmail(lead, subject, body);
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
