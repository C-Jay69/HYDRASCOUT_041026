import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';
import { Deal } from '@/lib/automation/types';
import { uid } from '@/lib/automation/rng';

export const dynamic = 'force-dynamic';

/**
 * GET /api/deals — deal list enriched with lead + buyer summaries.
 */
export async function GET() {
  const store = getStore();
  const [deals, buyers] = await Promise.all([store.listDeals(), store.listBuyers(false)]);
  const buyerById = new Map(buyers.map((b) => [b.id, b]));
  const enriched = [] as Array<Deal & { leadAddress: string | null; buyerName: string | null }>;
  for (const deal of deals) {
    const lead = await store.getLead(deal.leadId);
    enriched.push({
      ...deal,
      leadAddress: lead ? `${lead.propertyAddress}, ${lead.city}, ${lead.state}` : null,
      buyerName: deal.buyerId ? buyerById.get(deal.buyerId)?.name ?? null : null,
    });
  }
  return NextResponse.json({ deals: enriched, count: enriched.length });
}

/**
 * POST /api/deals — pitch a lead to a buyer (creates a deal in `pitched`
 * status and flips the lead to `converted`). If an open deal already
 * exists for the lead, it is reused/updated instead of duplicated.
 *
 * Body: { leadId: string, buyerId?: string, matchScore?: number, notes?: string }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const leadId = String(body.leadId || '');
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

  const store = getStore();
  const lead = await store.getLead(leadId);
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  if (body.buyerId !== undefined && body.buyerId !== null) {
    const buyer = await store.getBuyer(String(body.buyerId));
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Reuse an existing open deal for this lead rather than duplicating it
  const existing = await store.getDealByLead(leadId);
  if (existing && existing.status !== 'closed' && existing.status !== 'fell_through') {
    const updated: Deal = {
      ...existing,
      buyerId: body.buyerId ? String(body.buyerId) : existing.buyerId,
      matchScore: body.matchScore !== undefined ? Number(body.matchScore) : existing.matchScore,
      notes: body.notes !== undefined ? String(body.notes) : existing.notes,
      updatedAt: now,
    };
    await store.saveDeal(updated);
    if (lead.status !== 'under_contract' && lead.status !== 'assigned' && lead.status !== 'closed') {
      await store.updateLead(leadId, { status: 'converted' });
    }
    return NextResponse.json({ deal: updated, reused: true });
  }

  const deal: Deal = {
    id: uid('deal_'),
    leadId,
    buyerId: body.buyerId ? String(body.buyerId) : null,
    status: 'pitched',
    matchScore: body.matchScore !== undefined && body.matchScore !== null ? Number(body.matchScore) : null,
    notes: String(body.notes || ''),
    createdAt: now,
    updatedAt: now,
    assignedAt: null,
    closedAt: null,
  };
  await store.saveDeal(deal);
  await store.updateLead(leadId, { status: 'converted' });
  return NextResponse.json({ deal, reused: false }, { status: 201 });
}
