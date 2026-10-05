import { NextRequest, NextResponse } from 'next/server';
import { getStore, normalizeEmail, normalizePhone } from '@/lib/automation/store';
import { uid } from '@/lib/automation/rng';

export const dynamic = 'force-dynamic';

/**
 * GET /api/compliance — the Do-Not-Contact (suppression) list.
 */
export async function GET() {
  const store = getStore();
  const suppressions = await store.listSuppressions();
  return NextResponse.json({ suppressions, backend: store.backend });
}

/**
 * POST /api/compliance — manual suppression entry (admin action).
 * Body: { value: string (phone or email), reason?: string, note?: string, leadId?: string }
 * Phone vs email is auto-detected from the value's shape.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawValue = String(body.value || '').trim();
  if (!rawValue) {
    return NextResponse.json({ error: 'A phone number or email address is required' }, { status: 400 });
  }

  // Auto-detect type: emails contain @, phones are digits/+/-/( )/spaces
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawValue);
  const looksLikePhone = /^[+]?[\d\s().-]{7,20}$/.test(rawValue);
  if (!looksLikeEmail && !looksLikePhone) {
    return NextResponse.json({ error: 'Value must be a phone number or an email address' }, { status: 400 });
  }

  const type: 'phone' | 'email' = looksLikeEmail ? 'email' : 'phone';
  const value = type === 'email' ? normalizeEmail(rawValue) : normalizePhone(rawValue);
  if (!value) {
    return NextResponse.json({ error: 'Could not normalize the phone number' }, { status: 400 });
  }

  const store = getStore();
  const record = await store.addSuppression({
    id: uid('sup_'),
    value,
    type,
    reason: String(body.reason || 'manual'),
    source: 'manual',
    leadId: body.leadId ? String(body.leadId) : null,
    note: String(body.note || ''),
    createdAt: new Date().toISOString(),
  });
  await store.addConsentEvent({
    id: uid('ce_'),
    leadId: record.leadId,
    buyerId: null,
    type: 'opt_out',
    channel: type === 'email' ? 'email' : 'sms',
    value: record.value,
    detail: `Manual suppression added by admin: ${record.value} (${type}, reason: ${record.reason})${record.note ? ` — ${record.note}` : ''}.`,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ suppression: record }, { status: 201 });
}
