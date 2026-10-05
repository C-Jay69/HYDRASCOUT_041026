import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/compliance/events — consent audit log (every opt-out, opt-in,
 * blocked send and help request). Optional query params: leadId, limit.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const leadId = sp.get('leadId') || undefined;
  const limit = sp.get('limit') ? Number(sp.get('limit')) : 200;
  const store = getStore();
  let events = await store.listConsentEvents(limit);
  if (leadId) events = events.filter((e) => e.leadId === leadId);
  return NextResponse.json({ events });
}
