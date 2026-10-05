import { NextRequest, NextResponse } from 'next/server';
import { getStore, normalizePhone, phonesMatch } from '@/lib/automation/store';
import { uid } from '@/lib/automation/rng';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/twilio — inbound SMS webhook (TCPA enforcement).
 *
 * Configure in the Twilio console as the "A Message Comes In" webhook for
 * your messaging number. Handles the standard US carrier keywords:
 *
 *   STOP / STOPALL / UNSUBSCRIBE / CANCEL / END / QUIT
 *       → add the From number to the Do-Not-Contact list + consent audit
 *         event, reply with confirmation TwiML. All future sendOutreach /
 *         notifyBuyer dispatches to that number are hard-blocked.
 *   START / UNSTOP / YES
 *       → remove the number from the suppression list (opt back in)
 *   HELP / INFO
 *       → reply with contact info
 *
 * Responds with TwiML so Twilio can relay the auto-reply to the sender.
 */

const STOP_KEYWORDS = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'REMOVE'];
const START_KEYWORDS = ['START', 'UNSTOP', 'YES', 'SUBSCRIBE'];
const HELP_KEYWORDS = ['HELP', 'INFO'];

function twiml(message?: string): NextResponse {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message></Response>`
    : '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  let from = '';
  let body = '';
  try {
    const form = await req.formData();
    from = String(form.get('From') || '');
    body = String(form.get('Body') || '').trim();
  } catch {
    return twiml();
  }
  if (!from) return twiml();

  const store = getStore();
  const keyword = body.toUpperCase().replace(/[^A-Z]/g, '');

  // Best-effort link to a CRM lead for audit context
  let leadId: string | null = null;
  try {
    const leads = await store.listLeads({ limit: 2000 });
    const match = leads.find((l) => l.phones.some((p) => phonesMatch(p.number, from)));
    leadId = match?.id ?? null;
  } catch {
    leadId = null;
  }

  const digits = normalizePhone(from);

  if (STOP_KEYWORDS.includes(keyword)) {
    await store.addSuppression({
      id: uid('sup_'),
      value: digits,
      type: 'phone',
      reason: 'sms_stop',
      source: 'twilio_webhook',
      leadId,
      note: `Inbound "${body}" from ${from}`,
      createdAt: new Date().toISOString(),
    });
    await store.addConsentEvent({
      id: uid('ce_'),
      leadId,
      buyerId: null,
      type: 'opt_out',
      channel: 'sms',
      value: digits,
      detail: `Inbound SMS "${body}" from ${from} — number added to Do-Not-Contact list (TCPA STOP).`,
      createdAt: new Date().toISOString(),
    });
    return twiml(
      'You have been unsubscribed and will receive no further messages. Reply START to re-subscribe.',
    );
  }

  if (START_KEYWORDS.includes(keyword)) {
    const removed = await store.removeSuppressionByValue(digits);
    await store.addConsentEvent({
      id: uid('ce_'),
      leadId,
      buyerId: null,
      type: 'opt_in',
      channel: 'sms',
      value: digits,
      detail: `Inbound SMS "${body}" from ${from} — ${removed ? 'removed from Do-Not-Contact list' : 'was not suppressed'} (START).`,
      createdAt: new Date().toISOString(),
    });
    return twiml('Welcome back! You will now receive messages again. Reply STOP anytime to opt out.');
  }

  if (HELP_KEYWORDS.includes(keyword)) {
    await store.addConsentEvent({
      id: uid('ce_'),
      leadId,
      buyerId: null,
      type: 'help_request',
      channel: 'sms',
      value: digits,
      detail: `Inbound SMS "${body}" from ${from} — HELP info sent.`,
      createdAt: new Date().toISOString(),
    });
    return twiml(
      'Hydrascout Home Solutions: we buy houses as-is. Call (800) 555-0100. Reply STOP to opt out.',
    );
  }

  // Any other inbound reply is recorded as a lead reply (no auto-response)
  return twiml();
}
