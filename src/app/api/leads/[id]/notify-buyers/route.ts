import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';
import { matchBuyers } from '@/lib/automation/buyers';
import { notifyBuyer } from '@/lib/automation/outreach';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads/[id]/notify-buyers — pitch a lead to the top matching
 * buyers (or an explicit buyer list). Every notification runs through the
 * same TCPA compliance gate as seller outreach: if the lead's or buyer's
 * contact info is on the Do-Not-Contact list, the send is blocked
 * (status "suppressed", provider "compliance-gate") and audited.
 *
 * Body: { buyerIds?: string[], top?: number }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const store = getStore();
  const lead = await store.getLead(id);
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const buyers = await store.listBuyers(false);
  const allMatches = matchBuyers(lead, buyers, false);

  let selected: typeof allMatches;
  const requestedIds = Array.isArray(body.buyerIds) ? body.buyerIds.map((b) => String(b)) : [];
  if (requestedIds.length) {
    selected = allMatches.filter((m) => requestedIds.includes(m.buyer.id));
    const missing = requestedIds.filter((rid) => !selected.some((m) => m.buyer.id === rid));
    if (missing.length) {
      return NextResponse.json({ error: `Buyer(s) not found or inactive: ${missing.join(', ')}` }, { status: 400 });
    }
  } else {
    const top = body.top ? Math.max(1, Number(body.top)) : 3;
    selected = allMatches.slice(0, top);
  }

  if (!selected.length) {
    return NextResponse.json({ error: 'No active buyers to notify — add buyers first' }, { status: 400 });
  }

  const communications = [];
  for (const match of selected) {
    const comm = await notifyBuyer(match.buyer, lead, { score: match.score, reasons: match.reasons });
    communications.push(comm);
  }
  await store.addCommunications(communications);

  const notified = communications.filter((c) => c.status !== 'suppressed');
  const blocked = communications.filter((c) => c.status === 'suppressed');

  // First successful pitch moves the lead into the deal funnel
  if (notified.length && ['new', 'contacted', 'replied', 'interested', 'appointment'].includes(lead.status)) {
    await store.updateLead(lead.id, { status: 'converted' });
  }

  return NextResponse.json({
    notifiedCount: notified.length,
    blockedCount: blocked.length,
    suppressed: blocked.length > 0 && notified.length === 0,
    communications,
  });
}
