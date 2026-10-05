import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/automation/store';

export const dynamic = 'force-dynamic';

/** GET /api/buyers/[id] — single buyer. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buyer = await getStore().getBuyer(id);
  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
  return NextResponse.json({ buyer });
}

/**
 * PATCH /api/buyers/[id] — update buy-box criteria, contact info, active
 * flag or notes. `dealsClosed` is intentionally read-only here (it is
 * incremented only by the deal lifecycle).
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
  const buyer = await store.getBuyer(id);
  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

  const allowed = [
    'name', 'company', 'email', 'phone', 'markets', 'minPrice', 'maxPrice',
    'propertyTypes', 'financing', 'minEquityPercent', 'maxRehabBudget', 'active', 'notes',
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: `No updatable fields provided (${allowed.join(', ')})` }, { status: 400 });
  }

  const updated = {
    ...buyer,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await store.updateBuyer(updated);
  return NextResponse.json({ buyer: updated });
}

/** DELETE /api/buyers/[id] — remove a buyer from the network. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const buyer = await store.getBuyer(id);
  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
  await store.deleteBuyer(id);
  return NextResponse.json({ deleted: true });
}
