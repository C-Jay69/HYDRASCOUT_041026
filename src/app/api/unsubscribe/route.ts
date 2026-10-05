import { NextRequest, NextResponse } from 'next/server';
import { getStore, normalizeEmail } from '@/lib/automation/store';
import { unsubscribeToken } from '@/lib/automation/ai';
import { uid } from '@/lib/automation/rng';

export const dynamic = 'force-dynamic';

/**
 * GET /api/unsubscribe?lead=<leadId>&email=<address>&token=<hmac>
 *
 * One-click email unsubscribe (CAN-SPAM). The link is embedded in outreach
 * emails via the {{unsubscribe_url}} personalization variable and signed
 * with an HMAC so it can't be forged. Clicking it adds the address to the
 * Do-Not-Contact list, writes a consent audit event, and renders a styled
 * confirmation page.
 */

const BRAND = '#1a56db';

function page(title: string, heading: string, message: string, ok: boolean): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f6fb; color: #1e293b; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .card { background: #fff; border-radius: 16px; box-shadow: 0 10px 40px rgba(15, 40, 100, .08); max-width: 520px; width: 100%; padding: 48px 40px; text-align: center; }
  .logo { font-size: 20px; font-weight: 800; letter-spacing: .12em; color: ${BRAND}; text-transform: uppercase; margin-bottom: 28px; }
  .icon { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 30px; color: #fff; background: ${ok ? '#10b981' : '#ef4444'}; }
  h1 { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
  p { font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 8px; }
  .muted { font-size: 12px; color: #94a3b8; margin-top: 28px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">Hydrascout</div>
    <div class="icon">${ok ? '&#10003;' : '&#9888;'}</div>
    <h1>${heading}</h1>
    <p>${message}</p>
    <p class="muted">Hydrascout Home Solutions &middot; You are receiving this page because an unsubscribe link was clicked.</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 403,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const leadId = sp.get('lead');
  const email = sp.get('email') || '';
  const token = sp.get('token') || '';

  if (!email || !token) {
    return page('Unsubscribe — Hydrascout', 'Invalid link', 'This unsubscribe link is missing required parameters. Please reply to the original email to be removed.', false);
  }

  // Verify the HMAC signature — tokens can't be forged or brute-forced per-address
  const expected = unsubscribeToken(leadId || '', email);
  if (token !== expected) {
    return page('Unsubscribe — Hydrascout', 'Invalid link', 'This unsubscribe link could not be verified (bad signature). Please reply to the original email to be removed.', false);
  }

  try {
    const store = getStore();
    const record = await store.addSuppression({
      id: uid('sup_'),
      value: normalizeEmail(email),
      type: 'email',
      reason: 'email_unsubscribe',
      source: 'unsubscribe_link',
      leadId: leadId || null,
      note: `One-click unsubscribe${leadId ? ` (lead ${leadId})` : ''}`,
      createdAt: new Date().toISOString(),
    });
    await store.addConsentEvent({
      id: uid('ce_'),
      leadId: record.leadId,
      buyerId: null,
      type: 'opt_out',
      channel: 'email',
      value: record.value,
      detail: `One-click unsubscribe link clicked for ${record.value}${leadId ? ` — lead ${leadId}` : ''}. Address added to Do-Not-Contact list.`,
      createdAt: new Date().toISOString(),
    });
    return page(
      'Unsubscribed — Hydrascout',
      'You\u2019ve been unsubscribed',
      `${record.value} has been removed from our outreach list. You will not receive further emails from us. This action has been logged for our compliance records.`,
      true,
    );
  } catch (err) {
    return page('Unsubscribe — Hydrascout', 'Something went wrong', `We couldn't process your unsubscribe request right now (${err instanceof Error ? err.message : 'unknown error'}). Please reply to the original email to be removed.`, false);
  }
}
