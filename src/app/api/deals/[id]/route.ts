import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';
import { Deal, DealStatus, LeadStatus } from '@/lib/automation/types';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: DealStatus[] = ['pitched', 'assigned', 'closed', 'fell_through'];

/** Lead status kept in sync with the deal lifecycle. */
const LEAD_STATUS_BY_DEAL: Record<DealStatus, LeadStatus> = {
  pitched: 'converted',
  assigned: 'assigned',
  closed: 'closed',
  fell_through: 'converted',
};

/**
 * PATCH /api/deals/[id] — advance the deal lifecycle
 * (pitched → assigned → closed / fell_through).
 *
 * Body: { status?: DealStatus, buyerId?: string, notes?: string }
 * - `assigned` requires a buyerId (on the deal or in the body) and stamps assignedAt
 * - `closed` stamps closedAt, increments the buyer's dealsClosed (once) and
 *   syncs the lead status through the funnel
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const store = getStore();
  const deal = await store.getDeal(id);
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

  const status = body.status !== undefined ? String(body.status) as DealStatus : undefined;
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status — must be one of ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  const now = new Date().toISOString();
  let buyerId = deal.buyerId;
  if (body.buyerId !== undefined && body.buyerId !== null) {
    const buyer = await store.getBuyer(String(body.buyerId));
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    buyerId = buyer.id;
  }

  if (status === 'assigned' && !buyerId) {
    return NextResponse.json({ error: 'Cannot assign a deal without a buyer — provide buyerId' }, { status: 400 });
  }

  const updated: Deal = {
    ...deal,
    buyerId,
    status: status ?? deal.status,
    notes: body.notes !== undefined ? String(body.notes) : deal.notes,
    assignedAt: status === 'assigned' ? deal.assignedAt ?? now : deal.assignedAt,
    closedAt: status === 'closed' ? deal.closedAt ?? now : status === 'fell_through' ? null : deal.closedAt,
    updatedAt: now,
  };

  // Buyer stats — increment dealsClosed exactly once per deal
  if (status === 'closed' && deal.status !== 'closed' && updated.buyerId) {
    const buyer = await store.getBuyer(updated.buyerId);
    if (buyer) {
      await store.updateBuyer({ ...buyer, dealsClosed: buyer.dealsClosed + 1, updatedAt: now });
    }
  }

  await store.saveDeal(updated);

  // Keep the lead CRM status in sync with the deal funnel
  const lead = await store.getLead(deal.leadId);
  if (lead && status) {
    await store.updateLead(lead.id, { status: LEAD_STATUS_BY_DEAL[status] });
  }

  return NextResponse.json({ deal: updated, leadStatus: status ? LEAD_STATUS_BY_DEAL[status] : undefined });
}

/** GET /api/deals/[id] — single deal with lead + buyer context. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const deal = await store.getDeal(id);
  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  const [lead, buyer] = await Promise.all([
    store.getLead(deal.leadId),
    deal.buyerId ? store.getBuyer(deal.buyerId) : Promise.resolve(null),
  ]);
  return NextResponse.json({ deal, lead, buyer });
}
